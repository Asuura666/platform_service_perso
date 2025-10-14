from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base model with created/updated timestamps."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ('-created_at',)


class Webtoon(TimeStampedModel):
    """Represents a Webtoon tracked by a user."""

    STATUS_CHOICES = (
        ('En cours', 'En cours'),
        ('Terminé', 'Terminé'),
        ('Hiatus', 'Hiatus'),
    )

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=50)
    language = models.CharField(max_length=50)
    rating = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        help_text='Note entre 0 et 5.',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='En cours')
    chapter = models.PositiveIntegerField(help_text='Dernier chapitre lu.')
    link = models.URLField(blank=True)
    last_update = models.DateTimeField(auto_now=True)
    last_read_date = models.DateField(null=True, blank=True)
    comment = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='webtoons',
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = 'webtoon'
        verbose_name_plural = 'webtoons'
        ordering = ('-last_update', 'title')

    def __str__(self) -> str:
        return f'{self.title} ({self.user})'


class Chapter(TimeStampedModel):
    """Represents a chapter attached to a webtoon."""

    webtoon = models.ForeignKey(
        Webtoon,
        on_delete=models.CASCADE,
        related_name='chapters',
    )
    chapter_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    release_date = models.DateField(null=True, blank=True)
    local_folder = models.CharField(max_length=500, blank=True)
    local_image_paths = models.JSONField(default=list, blank=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = 'chapter'
        verbose_name_plural = 'chapters'
        ordering = ('webtoon', 'chapter_number')
        unique_together = ('webtoon', 'chapter_number')

    def __str__(self) -> str:
        return f'{self.webtoon.title} - Chapitre {self.chapter_number}'


class Comment(TimeStampedModel):
    """Represents a comment left by a user on a webtoon."""

    webtoon = models.ForeignKey(
        Webtoon,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    text = models.TextField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='webtoon_comments',
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = 'comment'
        verbose_name_plural = 'comments'
        ordering = ('-created_at',)

    def __str__(self) -> str:
        return f'Commentaire de {self.user} sur {self.webtoon}'
