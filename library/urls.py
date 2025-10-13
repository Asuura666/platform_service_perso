from rest_framework.routers import DefaultRouter

from .views import (
    ChapterViewSet,
    ContentViewSet,
    FeatureCategoryViewSet,
    UserProgressViewSet,
)

router = DefaultRouter()
router.register(r"categories", FeatureCategoryViewSet, basename="feature-category")
router.register(r"contents", ContentViewSet, basename="content")
router.register(r"chapters", ChapterViewSet, basename="chapter")
router.register(r"progress", UserProgressViewSet, basename="user-progress")

urlpatterns = router.urls
