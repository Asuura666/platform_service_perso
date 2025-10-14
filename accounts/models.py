from django.contrib.auth.models import AbstractUser
from django.db import models


class Feature(models.Model):
    """Feature flag allowing fine-grained access control on the platform."""

    code = models.CharField(
        "code",
        max_length=64,
        unique=True,
        help_text="Identifiant unique de la fonctionnalité (utilisé par le front et les permissions).",
    )
    name = models.CharField("nom", max_length=128)
    description = models.TextField("description", blank=True)

    class Meta:
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    """Main user model with role awareness."""

    class Roles(models.TextChoices):
        USER = "user", "User"
        ADMIN = "admin", "Administrator"

    email = models.EmailField("email address", unique=True)
    role = models.CharField(
        "role",
        max_length=32,
        choices=Roles.choices,
        default=Roles.USER,
    )
    features = models.ManyToManyField(
        Feature,
        blank=True,
        related_name="users",
        verbose_name="fonctions disponibles",
        help_text="Fonctionnalités auxquelles cet utilisateur a accès.",
    )

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"

    def has_feature(self, code: str) -> bool:
        """
        Return True if the user has access to the given feature code.

        Superusers bypass feature checks automatically.
        """

        if self.is_superuser:
            return True
        return self.features.filter(code=code).exists()
