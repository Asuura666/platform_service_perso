
from __future__ import annotations

import logging
import threading
from pathlib import Path
from typing import Iterable

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from api.models import Chapter, Webtoon
from scraper.crawler import ScrapeOutput, scrape_webtoon
from scraper.models import ScrapeJob

try:  # pragma: no cover - Celery peut être absent
    from celery import shared_task
except ImportError:  # pragma: no cover
    shared_task = None

logger = logging.getLogger(__name__)

MEDIA_SUBDIR = 'webtoons'
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
)


def enqueue_scrape(job_id: int) -> None:
    """Planifie une tâche de scraping."""

    if shared_task:  # pragma: no cover
        perform_scrape_task.delay(job_id)
    else:
        thread = threading.Thread(target=perform_scrape, args=(job_id,), daemon=True)
        thread.start()


def perform_scrape(job_id: int) -> None:
    """Exécute le scraping pour un job et persiste les résultats."""

    job = ScrapeJob.objects.select_related('user').get(pk=job_id)
    job.status = ScrapeJob.Status.RUNNING
    job.started_at = timezone.now()
    job.message = ''
    job.save(update_fields=['status', 'started_at', 'message', 'updated_at'])

    try:
        output = scrape_webtoon(job.url)
        _persist_scrape(job, output)
    except Exception as exc:  # noqa: broad-except
        logger.exception("Scraping échoué pour %s", job.url)
        job.status = ScrapeJob.Status.FAILED
        job.message = str(exc)
    else:
        job.status = ScrapeJob.Status.SUCCESS
    finally:
        job.finished_at = timezone.now()
        job.save(update_fields=['status', 'message', 'finished_at', 'updated_at'])


if shared_task:  # pragma: no cover

    @shared_task(name='scraper.perform_scrape')
    def perform_scrape_task(job_id: int) -> None:
        perform_scrape(job_id)


def _persist_scrape(job: ScrapeJob, data: ScrapeOutput) -> None:
    with transaction.atomic():
        webtoon, created = Webtoon.objects.get_or_create(
            user=job.user,
            title=data.title,
            defaults={
                'type': 'Scraper',
                'language': 'Francais',
                'rating': 0,
                'status': 'En cours',
                'chapter': 0,
                'link': job.url,
                'comment': f'Scrapé automatiquement depuis {job.url}',
            },
        )

        if not created:
            updated = False
            if not webtoon.link:
                webtoon.link = job.url
                updated = True
            if data.cover_image and not webtoon.image_url:
                webtoon.image_url = data.cover_image
                updated = True
            if updated:
                webtoon.save(update_fields=['link', 'image_url', 'updated_at'])

        job.webtoon = webtoon

        media_root = Path(settings.MEDIA_ROOT) / MEDIA_SUBDIR / slugify(data.title or webtoon.title)
        media_root.mkdir(parents=True, exist_ok=True)

        total_images = 0
        max_chapter = webtoon.chapter

        for chapter in data.chapters:
            chapter_folder = media_root / f'chapter-{chapter.chapter_number:04d}'
            chapter_folder.mkdir(parents=True, exist_ok=True)
            image_paths = _download_images(chapter.images, chapter_folder)
            total_images += len(image_paths)

            Chapter.objects.update_or_create(
                webtoon=webtoon,
                chapter_number=chapter.chapter_number,
                defaults={
                    'title': chapter.title,
                    'release_date': chapter.release_date,
                    'local_folder': str(chapter_folder.relative_to(settings.MEDIA_ROOT)),
                    'local_image_paths': [
                        str((chapter_folder / image).relative_to(settings.MEDIA_ROOT)) for image in image_paths
                    ],
                },
            )
            max_chapter = max(max_chapter, chapter.chapter_number)

        if max_chapter != webtoon.chapter:
            webtoon.chapter = max_chapter
            webtoon.save(update_fields=['chapter', 'updated_at'])

        job.chapters_scraped = len(data.chapters)
        job.images_downloaded = total_images
        job.media_root = str(media_root.relative_to(settings.MEDIA_ROOT))
        job.message = f"{len(data.chapters)} chapitres importés."
        job.save(
            update_fields=[
                'webtoon',
                'chapters_scraped',
                'images_downloaded',
                'media_root',
                'message',
                'updated_at',
            ]
        )


def _download_images(urls: Iterable[str], folder: Path, timeout: int = 15) -> list[str]:
    filenames: list[str] = []
    for idx, url in enumerate(urls, start=1):
        if not url:
            continue
        try:
            response = requests.get(url, timeout=timeout, headers={'User-Agent': USER_AGENT})
            response.raise_for_status()
        except requests.RequestException:
            logger.warning("Impossible de télécharger %s", url)
            continue

        extension = _guess_extension(url)
        filename = f'image-{idx:03d}{extension}'
        path = folder / filename
        path.write_bytes(response.content)
        filenames.append(filename)
    return filenames


def _guess_extension(url: str) -> str:
    for ext in ('.jpg', '.jpeg', '.png', '.gif', '.webp'):
        if url.lower().endswith(ext):
            return ext
    return '.jpg'
