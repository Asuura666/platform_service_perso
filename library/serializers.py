from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Chapter, Content, FeatureCategory, UserProgress

User = get_user_model()


class FeatureCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureCategory
        fields = ("id", "name", "description", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = (
            "id",
            "content",
            "chapter_number",
            "title",
            "release_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ContentSerializer(serializers.ModelSerializer):
    feature_category_detail = FeatureCategorySerializer(
        source="feature_category", read_only=True
    )
    chapter_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Content
        fields = (
            "id",
            "title",
            "author",
            "language",
            "status",
            "rating",
            "description",
            "feature_category",
            "feature_category_detail",
            "chapter_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "chapter_count", "created_at", "updated_at")


class UserProgressSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    content_detail = ContentSerializer(source="content", read_only=True)
    progress_date = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = UserProgress
        fields = (
            "id",
            "user",
            "content",
            "content_detail",
            "last_chapter",
            "notes",
            "progress_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "content_detail", "progress_date", "created_at", "updated_at")
