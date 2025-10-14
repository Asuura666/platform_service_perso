import shutil
import tempfile
from pathlib import Path
from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Feature, User
from api.models import Chapter, Webtoon
from scraper.crawler import ScrapeOutput, ScrapedChapter
from scraper.models import ScrapeJob
from scraper.tasks import perform_scrape


class ScraperAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='password', email='tester@example.com')
        self.scraper_feature = Feature.objects.get(code='scraper_access')
        self.user.features.add(self.scraper_feature)
        self.client.force_authenticate(self.user)
        self.tempdir = tempfile.mkdtemp(prefix='webtoon-media-')
        self.addCleanup(lambda: shutil.rmtree(self.tempdir, ignore_errors=True))

    def _mock_scrape_output(self):
        return ScrapeOutput(
            title='Demo Webtoon',
            cover_image=None,
            chapters=[
                ScrapedChapter(
                    title='Chapitre 1',
                    chapter_number=1,
                    url='https://example.com/ch1',
                    images=['https://example.com/image1.jpg'],
                ),
                ScrapedChapter(
                    title='Chapitre 2',
                    chapter_number=2,
                    url='https://example.com/ch2',
                    images=['https://example.com/image2.jpg'],
                ),
            ],
        )

    def _patch_requests_get(self):
        class DummyResponse:
            status_code = 200
            content = b'binary-image-data'

            def raise_for_status(self):
                return None

        return patch('scraper.tasks.requests.get', return_value=DummyResponse())

    def _trigger_scrape(self):
        output = self._mock_scrape_output()
        with patch('scraper.tasks.scrape_webtoon', return_value=output), self._patch_requests_get(), override_settings(
            MEDIA_ROOT=self.tempdir
        ), patch('scraper.views.enqueue_scrape', side_effect=lambda job_id: perform_scrape(job_id)):
            response = self.client.post(reverse('scraper:scrape-launch'), {'url': 'https://example.com/manga/'})
        return response

    def test_scraper_endpoint_exists(self):
        response = self._trigger_scrape()
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertIn('id', response.data)

    def test_scraper_invalid_url_returns_400(self):
        response = self.client.post(reverse('scraper:scrape-launch'), {'url': 'invalid-url'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_without_feature_is_forbidden(self):
        other_user = User.objects.create_user(
            username='noaccess',
            password='password',
            email='noaccess@example.com',
        )
        self.client.force_authenticate(other_user)
        response = self.client.post(reverse('scraper:scrape-launch'), {'url': 'https://example.com/'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # restore context for following tests
        self.client.force_authenticate(self.user)

    def test_scraper_creates_webtoon_and_chapters(self):
        response = self._trigger_scrape()
        job_id = response.data['id']
        job = ScrapeJob.objects.get(pk=job_id)
        self.assertEqual(job.status, ScrapeJob.Status.SUCCESS)

        webtoon = Webtoon.objects.get(user=self.user, title='Demo Webtoon')
        self.assertEqual(webtoon.chapters.count(), 2)
        self.assertEqual(job.chapters_scraped, 2)
        self.assertEqual(job.images_downloaded, 2)

    def test_scraper_stores_images_locally(self):
        self._trigger_scrape()
        chapter = Chapter.objects.get(chapter_number=1, webtoon__title='Demo Webtoon')
        self.assertTrue(chapter.local_image_paths)
        for relative in chapter.local_image_paths:
            path = Path(self.tempdir) / relative
            self.assertTrue(path.exists())

    def test_scraper_status_returns_progress(self):
        response = self._trigger_scrape()
        job_id = response.data['id']
        status_response = self.client.get(reverse('scraper:scrape-status', args=[job_id]))
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(status_response.data['status'], ScrapeJob.Status.SUCCESS)

    def test_scraper_history_lists_jobs(self):
        self._trigger_scrape()
        history_response = self.client.get(reverse('scraper:scrape-history'))
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(history_response.data), 1)
