from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class AuthenticationTests(APITestCase):
    def test_user_registration_and_login(self):
        payload = {
            "username": "akira",
            "email": "akira@example.com",
            "password": "motdepassefort",
        }
        response = self.client.post(reverse("register"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="akira").exists())

        login_response = self.client.post(
            reverse("login"),
            {"username": "akira", "password": "motdepassefort"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)

    def test_registration_requires_unique_email(self):
        User.objects.create_user(
            username="existing",
            email="akira@example.com",
            password="motdepassefort",
        )
        payload = {
            "username": "akira",
            "email": "akira@example.com",
            "password": "autremotdepasse",
        }
        response = self.client.post(reverse("register"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
