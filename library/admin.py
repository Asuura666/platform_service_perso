from django.contrib import admin

from .models import Chapter, Content, FeatureCategory, UserProgress


@admin.register(FeatureCategory)
class FeatureCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "created_at", "updated_at")
    search_fields = ("name",)


@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "feature_category",
        "status",
        "rating",
        "language",
        "created_at",
    )
    list_filter = ("feature_category", "status", "language")
    search_fields = ("title", "author")


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ("content", "chapter_number", "title", "release_date")
    list_filter = ("content",)
    search_fields = ("title", "chapter_number")


@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "content", "last_chapter", "updated_at")
    list_filter = ("user", "content")
    search_fields = ("user__username", "content__title", "last_chapter")
