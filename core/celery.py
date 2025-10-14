"""Celery application instance for background task processing."""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

celery_app = Celery("core")
celery_app.config_from_object("django.conf:settings", namespace="CELERY")
celery_app.autodiscover_tasks()

celery_app.conf.update(
    worker_prefetch_multiplier=int(os.getenv("CELERY_WORKER_PREFETCH_MULTIPLIER", "1")),
    task_default_queue=os.getenv("CELERY_TASK_DEFAULT_QUEUE", "default"),
)

__all__ = ("celery_app",)
