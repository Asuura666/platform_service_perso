from django.contrib import admin
from .models import FeatureCategory, Content, Chapter, UserProgress

@admin.register(FeatureCategory)
class FeatureCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name")

@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "feature_category", "status", "rating")
    list_filter = ("feature_category", "status")
    search_fields = ("title", "author")

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ("id", "content", "chapter_number", "title", "release_date")
    list_filter = ("content",)

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "content", "last_chapter", "last_read_at")
    list_filter = ("user", "content")
