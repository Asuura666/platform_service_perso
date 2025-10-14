from django.urls import path

from scraper.views import ScrapeHistoryView, ScrapeLaunchView, ScrapeStatusView

app_name = 'scraper'

urlpatterns = [
    path('scraper/', ScrapeLaunchView.as_view(), name='scrape-launch'),
    path('scraper/status/<int:pk>/', ScrapeStatusView.as_view(), name='scrape-status'),
    path('scraper/history/', ScrapeHistoryView.as_view(), name='scrape-history'),
]
