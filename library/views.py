from django.db.models import Count
from rest_framework import filters, permissions, viewsets

from .models import Chapter, Content, FeatureCategory, UserProgress
from .permissions import IsAdminOrReadOnly
from .serializers import (
    ChapterSerializer,
    ContentSerializer,
    FeatureCategorySerializer,
    UserProgressSerializer,
)


class FeatureCategoryViewSet(viewsets.ModelViewSet):
    queryset = FeatureCategory.objects.all()
    serializer_class = FeatureCategorySerializer
    permission_classes = (IsAdminOrReadOnly,)
    filter_backends = (filters.SearchFilter,)
    search_fields = ("name",)


class ContentViewSet(viewsets.ModelViewSet):
    serializer_class = ContentSerializer
    permission_classes = (IsAdminOrReadOnly,)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("title", "author")
    ordering_fields = ("title", "created_at", "updated_at")

    def get_queryset(self):
        queryset = Content.objects.select_related("feature_category").annotate(
            chapter_count=Count("chapters")
        )
        category_id = self.request.query_params.get("feature_category")
        status = self.request.query_params.get("status")
        if category_id:
            queryset = queryset.filter(feature_category_id=category_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset


class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.select_related("content", "content__feature_category")
    serializer_class = ChapterSerializer
    permission_classes = (IsAdminOrReadOnly,)
    filter_backends = (filters.SearchFilter,)
    search_fields = ("title", "chapter_number")

    def get_queryset(self):
        queryset = super().get_queryset()
        content_id = self.request.query_params.get("content")
        if content_id:
            queryset = queryset.filter(content_id=content_id)
        return queryset


class UserProgressViewSet(viewsets.ModelViewSet):
    serializer_class = UserProgressSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return (
            UserProgress.objects.select_related(
                "content",
                "content__feature_category",
                "user",
            )
            .filter(user=self.request.user)
            .annotate(chapter_count=Count("content__chapters"))
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)
