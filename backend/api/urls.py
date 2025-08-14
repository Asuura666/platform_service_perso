from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from core.views import (
    FeatureCategoryViewSet,
    ContentViewSet,
    ChapterViewSet,
    UserProgressViewSet,
)

router = DefaultRouter()
router.register(r"categories", FeatureCategoryViewSet, basename="categories")
router.register(r"contents", ContentViewSet, basename="contents")
router.register(r"chapters", ChapterViewSet, basename="chapters")
router.register(r"progress", UserProgressViewSet, basename="progress")

urlpatterns = [
    path("admin/", admin.site.urls),

    # API
    path("api/", include(router.urls)),

    # Auth JWT (Djoser / SimpleJWT)
    path("api/auth/", include("djoser.urls")),
    path("api/auth/", include("djoser.urls.jwt")),
]
