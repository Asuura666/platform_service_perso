from rest_framework import serializers
from .models import FeatureCategory, Content, Chapter, UserProgress

class FeatureCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureCategory
        fields = ("id", "name", "description")

class ContentSerializer(serializers.ModelSerializer):
    # Lecture : objet imbriqué
    feature_category = FeatureCategorySerializer(read_only=True)
    # Écriture : id → mappe vers le FK
    feature_category_id = serializers.PrimaryKeyRelatedField(
        source="feature_category",
        queryset=FeatureCategory.objects.all(),
        write_only=True,
        required=False,           # <-- important pour PATCH
        allow_null=True,          # <-- accepte null si l'UI envoie vide
    )

    class Meta:
        model = Content
        fields = [
            "id",
            "title",
            "author",
            "language",
            "status",
            "rating",
            "description",
            "link",
            "release_day",
            "feature_category",      # read-only
            "feature_category_id",   # write-only
            "cover_image",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("created_at", "updated_at")

    def validate(self, attrs):
        """
        Assainit quelques champs : rating "", etc.
        (ne convertit pas les CharField en None pour éviter null=False)
        """
        rating = attrs.get("rating", serializers.empty)
        if rating == "":
            attrs["rating"] = None
        return attrs

class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = "__all__"

class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = ["id", "user", "content", "last_chapter", "last_read_at", "notes"]
        read_only_fields = ["user"]
