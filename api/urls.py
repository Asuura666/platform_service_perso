from rest_framework.routers import DefaultRouter

from .views import WebtoonViewSet

app_name = 'api'

router = DefaultRouter()
router.register('webtoons', WebtoonViewSet, basename='webtoon')

urlpatterns = router.urls
