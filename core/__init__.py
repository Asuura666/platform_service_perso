"""Expose the Celery application for Django."""

from .celery import celery_app

__all__ = ("celery_app",)
