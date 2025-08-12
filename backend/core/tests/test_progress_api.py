from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.utils.dateparse import parse_datetime

from core.models import FeatureCategory, Content, UserProgress


class ProgressAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(username="user", password="pass")
        self.client.force_authenticate(self.user)
        self.cat = FeatureCategory.objects.create(name="Cat")
        self.content = Content.objects.create(title="Webtoon", feature_category=self.cat)
        self.url = f"/api/contents/{self.content.id}/progress/"

    def test_progress_increment_and_decrement(self):
        resp = self.client.post(self.url, {"delta": 1}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["last_chapter"], 1)

        resp = self.client.post(self.url, {"delta": 1}, format="json")
        self.assertEqual(resp.json()["last_chapter"], 2)

        resp = self.client.post(self.url, {"delta": -5}, format="json")
        self.assertEqual(resp.json()["last_chapter"], 0)

        up = UserProgress.objects.get(user=self.user, content=self.content)
        self.assertEqual(up.last_chapter, 0)
        self.assertIsNotNone(up.last_read_at)

    def test_set_chapter_and_date(self):
        ts = "2025-08-11T12:34:56Z"
        resp = self.client.post(self.url, {"chapter": "10", "last_read_at": ts}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["last_chapter"], 10)
        returned = parse_datetime(resp.json()["last_read_at"])
        self.assertEqual(returned, parse_datetime(ts))

    def test_invalid_chapter_sets_none(self):
        # first set a valid chapter
        self.client.post(self.url, {"chapter": "5"}, format="json")
        resp = self.client.post(self.url, {"chapter": "abc"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIsNone(resp.json()["last_chapter"])
        up = UserProgress.objects.get(user=self.user, content=self.content)
        self.assertIsNone(up.last_chapter)

    def test_my_progress_endpoint(self):
        # create some progress
        self.client.post(self.url, {"chapter": "3"}, format="json")
        my_url = f"/api/contents/{self.content.id}/my-progress/"
        resp = self.client.get(my_url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["last_chapter"], 3)
        self.assertIsNotNone(data["last_read_at"])
