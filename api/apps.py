from django.apps import AppConfig


class ApiConfig(AppConfig):
    """Configuration for the Webtoon API application."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    verbose_name = 'Webtoon Book API'
