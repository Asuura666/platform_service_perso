from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from api.models import Webtoon


class CommentAPITests(APITestCase):
    def setUp(self):
        self.login_url = reverse('login')
        self.owner = User.objects.create_user(
            username='comment_owner',
            email='comment_owner@example.com',
            password='Secure123',
        )
        self.webtoon = Webtoon.objects.create(
            title='Ethereal World',
            type='Webtoon',
            language='Anglais',
            rating=4.1,
            status='En cours',
            chapter=45,
            link='https://example.com/ethereal',
            user=self.owner,
        )

    def authenticate(self, username, password):
        response = self.client.post(
            self.login_url,
            {'username': username, 'password': password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_user_can_add_and_list_comments(self):
        self.authenticate('comment_owner', 'Secure123')
        comments_url = reverse('api:webtoon-comments', args=[self.webtoon.id])
        payload = {'text': 'Un univers immersif et lumineux.'}
        create_response = self.client.post(comments_url, payload, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data['text'], payload['text'])
        self.assertEqual(create_response.data['user'], 'comment_owner')

        list_response = self.client.get(comments_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]['text'], payload['text'])

    def test_other_user_cannot_comment_foreign_webtoon(self):
        self.authenticate('comment_owner', 'Secure123')
        comments_url = reverse('api:webtoon-comments', args=[self.webtoon.id])
        self.client.post(comments_url, {'text': 'Première note.'}, format='json')

        other_client = self.client.__class__()
        User.objects.create_user(
            username='comment_guest',
            email='guest@example.com',
            password='GuestPass456',
        )
        other_login = other_client.post(
            self.login_url,
            {'username': 'comment_guest', 'password': 'GuestPass456'},
            format='json',
        )
        self.assertEqual(other_login.status_code, status.HTTP_200_OK)
        other_client.credentials(HTTP_AUTHORIZATION=f"Bearer {other_login.data['access']}")

        list_response = other_client.get(comments_url)
        self.assertEqual(list_response.status_code, status.HTTP_404_NOT_FOUND)

        create_attempt = other_client.post(comments_url, {'text': 'Je ne devrais pas pouvoir.'}, format='json')
        self.assertEqual(create_attempt.status_code, status.HTTP_404_NOT_FOUND)
