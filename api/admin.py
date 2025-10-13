from django.contrib import admin

from .models import Chapter, Comment, Webtoon


@admin.register(Webtoon)
class WebtoonAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'language', 'status', 'rating', 'user', 'last_update')
    list_filter = ('status', 'language', 'type')
    search_fields = ('title', 'user__username')


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('webtoon', 'chapter_number', 'title', 'release_date')
    list_filter = ('webtoon',)
    search_fields = ('webtoon__title', 'title')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('webtoon', 'user', 'created_at')
    search_fields = ('webtoon__title', 'user__username', 'text')
