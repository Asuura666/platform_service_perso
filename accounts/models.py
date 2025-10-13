from django.contrib.auth.models import AbstractUser
from django.db import models


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

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"
