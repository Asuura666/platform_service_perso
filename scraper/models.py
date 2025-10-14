from __future__ import annotations

from django.conf import settings
from django.db import models

from api.models import Webtoon


class ScrapeJob(models.Model):
    """Représente une tâche de scraping exécutée par l'utilisateur."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        RUNNING = 'running', 'Running'
        SUCCESS = 'success', 'Success'
        FAILED = 'failed', 'Failed'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='scrape_jobs',
    )
    url = models.URLField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    message = models.TextField(blank=True)
    webtoon = models.ForeignKey(
        Webtoon,
        on_delete=models.SET_NULL,
        related_name='scrape_jobs',
        null=True,
        blank=True,
    )
    chapters_scraped = models.PositiveIntegerField(default=0)
    images_downloaded = models.PositiveIntegerField(default=0)
    media_root = models.CharField(max_length=500, blank=True)
    task_id = models.CharField(max_length=255, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self) -> str:
        return f"{self.url} ({self.status})"

    @property
    def duration_seconds(self) -> int | None:
        if self.started_at and self.finished_at:
            return int((self.finished_at - self.started_at).total_seconds())
        return None
