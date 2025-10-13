from django.conf import settings
from django.db import models


class DatestampModel(models.Model):
    """Common timestamp mixin."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ("-created_at",)


class FeatureCategory(DatestampModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "category"
        verbose_name_plural = "categories"
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name


class Content(DatestampModel):
    class Status(models.TextChoices):
        ONGOING = "ongoing", "Ongoing"
        COMPLETED = "completed", "Completed"
        HIATUS = "hiatus", "Hiatus"

    title = models.CharField(max_length=200)
    author = models.CharField(max_length=120, blank=True)
    language = models.CharField(max_length=50, default="fr")
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.ONGOING,
    )
    rating = models.PositiveSmallIntegerField(blank=True, null=True)
    description = models.TextField(blank=True)
    feature_category = models.ForeignKey(
        FeatureCategory,
        on_delete=models.PROTECT,
        related_name="contents",
    )

    class Meta:
        verbose_name = "content"
        verbose_name_plural = "content"
        ordering = ("title",)
        unique_together = ("title", "feature_category")

    def __str__(self) -> str:
        return f"{self.title} ({self.feature_category.name})"


class Chapter(DatestampModel):
    content = models.ForeignKey(
        Content,
        on_delete=models.CASCADE,
        related_name="chapters",
    )
    chapter_number = models.CharField(max_length=50)
    title = models.CharField(max_length=200, blank=True)
    release_date = models.DateField(blank=True, null=True)

    class Meta:
        verbose_name = "chapter"
        verbose_name_plural = "chapters"
        ordering = ("content", "chapter_number")
        unique_together = ("content", "chapter_number")

    def __str__(self) -> str:
        return f"{self.content.title} - chapter {self.chapter_number}"


class UserProgress(DatestampModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="progress",
    )
    content = models.ForeignKey(
        Content,
        on_delete=models.CASCADE,
        related_name="progress",
    )
    last_chapter = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "user progress"
        verbose_name_plural = "user progress"
        unique_together = ("user", "content")
        ordering = ("-updated_at",)

    def __str__(self) -> str:
        return f"{self.user.username} - {self.content.title} ({self.last_chapter})"
