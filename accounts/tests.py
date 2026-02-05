from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Feature, User


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


class AdminUserManagementTests(APITestCase):
    def setUp(self):
        self.superuser = User.objects.create_superuser(
            username="superadmin",
            email="superadmin@example.com",
            password="superpassword",
        )
        self.admin_users_url = reverse("admin-users-list")
        self.admin_features_url = reverse("admin-features-list")

    def authenticate(self, user):
        self.client.force_authenticate(user)

    def test_superuser_can_list_features(self):
        self.authenticate(self.superuser)
        response = self.client.get(self.admin_features_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        codes = {feature["code"] for feature in response.json()["results"]}
        expected_codes = set(Feature.objects.values_list("code", flat=True))
        self.assertTrue(expected_codes.issubset(codes))

    def test_superuser_can_create_user_with_features(self):
        self.authenticate(self.superuser)
        feature_codes = list(Feature.objects.values_list("code", flat=True)[:2])
        payload = {
            "username": "newaccount",
            "email": "newaccount@example.com",
            "password": "motdepasse123",
            "features": feature_codes,
        }
        response = self.client.post(self.admin_users_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_user = User.objects.get(username="newaccount")
        self.assertSetEqual(set(created_user.features.values_list("code", flat=True)), set(feature_codes))

    def test_non_superuser_cannot_access_admin_routes(self):
        regular_user = User.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="motdepasse",
        )
        self.authenticate(regular_user)

        users_response = self.client.get(self.admin_users_url)
        self.assertEqual(users_response.status_code, status.HTTP_403_FORBIDDEN)

        features_response = self.client.get(self.admin_features_url)
        self.assertEqual(features_response.status_code, status.HTTP_403_FORBIDDEN)
