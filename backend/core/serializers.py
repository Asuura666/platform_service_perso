from rest_framework import serializers
from .models import FeatureCategory, Content, Chapter, UserProgress

class FeatureCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureCategory
        fields = "__all__"

class ContentSerializer(serializers.ModelSerializer):
    feature_category = FeatureCategorySerializer(read_only=True)
    feature_category_id = serializers.PrimaryKeyRelatedField(
        source="feature_category", queryset=FeatureCategory.objects.all(), write_only=True
    )

    class Meta:
        model = Content
        fields = [
            "id","title","author","language","status","rating","description","link","release_day",
            "feature_category","feature_category_id","cover_image","created_at","updated_at"
        ]

class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = "__all__"



class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = ["id", "user", "content", "last_chapter", "last_read_at", "notes"]
        read_only_fields = ["user"]

