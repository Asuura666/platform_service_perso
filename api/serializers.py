from rest_framework import serializers

from .models import Chapter, Comment, Webtoon


class ChapterSerializer(serializers.ModelSerializer):
    """Serializer for Webtoon chapters."""

    class Meta:
        model = Chapter
        fields = (
            'id',
            'webtoon',
            'chapter_number',
            'title',
            'release_date',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'webtoon', 'created_at', 'updated_at')


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for Webtoon comments."""

    user = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'webtoon', 'text', 'user', 'created_at', 'updated_at')
        read_only_fields = ('id', 'webtoon', 'user', 'created_at', 'updated_at')


class WebtoonSerializer(serializers.ModelSerializer):
    """Serializer for Webtoon resources."""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    chapters_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Webtoon
        fields = (
            'id',
            'title',
            'type',
            'language',
            'rating',
            'status',
            'chapter',
            'link',
            'last_update',
            'last_read_date',
            'comment',
            'image_url',
            'user',
            'created_at',
            'updated_at',
            'chapters_count',
            'comments_count',
        )
        read_only_fields = (
            'id',
            'last_update',
            'created_at',
            'updated_at',
            'chapters_count',
            'comments_count',
        )

    def get_chapters_count(self, obj: Webtoon) -> int:
        return getattr(obj, 'chapters_count', None) or obj.chapters.count()

    def get_comments_count(self, obj: Webtoon) -> int:
        return getattr(obj, 'comments_count', None) or obj.comments.count()
