from django.db import models
from django.contrib.auth import get_user_model

class FeatureCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Content(models.Model):
    STATUS_CHOICES = [
        ("ongoing", "En cours"),
        ("completed", "Terminé"),
        ("hiatus", "En pause"),
        ("unknown", "Inconnu"),
    ]
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True)
    language = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unknown")
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    description = models.TextField(blank=True)
    link = models.URLField(blank=True)
    release_day = models.CharField(max_length=50, blank=True, help_text="Jour de sortie (texte libre)")
    feature_category = models.ForeignKey(FeatureCategory, on_delete=models.PROTECT, related_name="contents")
    cover_image = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]
        indexes = [models.Index(fields=["title"])]

    def __str__(self):
        return self.title

class Chapter(models.Model):
    content = models.ForeignKey(Content, on_delete=models.CASCADE, related_name="chapters")
    chapter_number = models.CharField(max_length=50)
    title = models.CharField(max_length=255, blank=True)
    release_date = models.DateField(null=True, blank=True)
    link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("content", "chapter_number")

    def __str__(self):
        return f"{self.content.title} - {self.chapter_number}"

User = get_user_model()

class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="progress")
    content = models.ForeignKey(Content, on_delete=models.CASCADE, related_name="progress")
    last_chapter = models.IntegerField(null=True, blank=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ("user", "content")
        ordering = ["-last_read_at"]
