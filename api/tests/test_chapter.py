from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from api.models import Webtoon


class ChapterAPITests(APITestCase):
    def setUp(self):
        self.login_url = reverse('login')
        self.user = User.objects.create_user(
            username='chapter_user',
            email='chapter@example.com',
            password='chapPass123',
        )
        self.webtoon = Webtoon.objects.create(
            title='Tower of God',
            type='Manhwa',
            language='Français',
            rating=4.7,
            status='En cours',
            chapter=600,
            link='https://example.com/tog',
            user=self.user,
        )

    def authenticate(self, username='chapter_user', password='chapPass123'):
        response = self.client.post(
            self.login_url,
            {'username': username, 'password': password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_user_can_add_and_list_chapters(self):
        self.authenticate()
        chapters_url = reverse('api:webtoon-chapters', args=[self.webtoon.id])
        payload = {
            'chapter_number': 601,
            'title': 'Retrouvailles',
            'release_date': '2024-11-15',
        }
        create_response = self.client.post(chapters_url, payload, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data['chapter_number'], 601)

        list_response = self.client.get(chapters_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]['title'], 'Retrouvailles')

    def test_other_user_cannot_access_chapters(self):
        self.authenticate()
        chapters_url = reverse('api:webtoon-chapters', args=[self.webtoon.id])
        payload = {
            'chapter_number': 601,
            'title': 'Retrouvailles',
            'release_date': '2024-11-15',
        }
        self.client.post(chapters_url, payload, format='json')

        other_client = self.client.__class__()
        User.objects.create_user(
            username='intrus',
            email='intrus@example.com',
            password='Password789',
        )
        other_login = other_client.post(
            self.login_url,
            {'username': 'intrus', 'password': 'Password789'},
            format='json',
        )
        self.assertEqual(other_login.status_code, status.HTTP_200_OK)
        other_client.credentials(HTTP_AUTHORIZATION=f"Bearer {other_login.data['access']}")

        list_response = other_client.get(chapters_url)
        self.assertEqual(list_response.status_code, status.HTTP_404_NOT_FOUND)

        create_attempt = other_client.post(chapters_url, payload, format='json')
        self.assertEqual(create_attempt.status_code, status.HTTP_404_NOT_FOUND)
