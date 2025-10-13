from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from .models import Content, FeatureCategory


class LibraryApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass",
            role=User.Roles.ADMIN,
            is_staff=True,
        )
        self.user = User.objects.create_user(
            username="reader",
            email="reader@example.com",
            password="readerpass",
        )

    def test_admin_can_create_category_and_content(self):
        self.client.force_authenticate(user=self.admin)
        category_response = self.client.post(
            reverse("feature-category-list"),
            {"name": "Manga", "description": "Bandes dessinées japonaises"},
            format="json",
        )
        self.assertEqual(category_response.status_code, status.HTTP_201_CREATED)
        category_id = category_response.data["id"]

        content_response = self.client.post(
            reverse("content-list"),
            {
                "title": "One Piece",
                "author": "Eiichiro Oda",
                "feature_category": category_id,
            },
            format="json",
        )
        self.assertEqual(content_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Content.objects.count(), 1)

    def test_regular_user_cannot_create_content_but_can_list(self):
        category = FeatureCategory.objects.create(name="Webtoon")
        self.client.force_authenticate(user=self.user)

        create_response = self.client.post(
            reverse("content-list"),
            {
                "title": "Solo Leveling",
                "feature_category": category.id,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)

        list_response = self.client.get(reverse("content-list"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
