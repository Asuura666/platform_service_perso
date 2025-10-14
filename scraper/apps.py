from django.apps import AppConfig


class ScraperConfig(AppConfig):
    """Configuration de l'application Scraper."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'scraper'
    verbose_name = 'Webtoon Scraper'
