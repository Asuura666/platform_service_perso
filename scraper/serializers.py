from rest_framework import serializers

from scraper.models import ScrapeJob


class ScrapeRequestSerializer(serializers.Serializer):
    url = serializers.URLField()


class ScrapeJobSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()
    webtoon_title = serializers.CharField(source='webtoon.title', read_only=True)

    class Meta:
        model = ScrapeJob
        fields = (
            'id',
            'url',
            'status',
            'message',
            'webtoon',
            'webtoon_title',
            'chapters_scraped',
            'images_downloaded',
            'media_root',
            'task_id',
            'created_at',
            'updated_at',
            'started_at',
            'finished_at',
            'duration',
        )
        read_only_fields = fields

    def get_duration(self, obj: ScrapeJob) -> str | None:
        seconds = obj.duration_seconds
        if seconds is None:
            return None
        minutes, sec = divmod(seconds, 60)
        hours, minutes = divmod(minutes, 60)
        return f"{hours:02d}:{minutes:02d}:{sec:02d}"
