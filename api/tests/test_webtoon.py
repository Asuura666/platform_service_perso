from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Feature, User
from api.models import Webtoon


class WebtoonAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.webtoon_list_url = reverse('api:webtoon-list')
        self.webtoon_feature = Feature.objects.get(code='webtoon_management')

    def authenticate(self):
        self.user = User.objects.create_user(
            username='melissa',
            email='melissa@example.com',
            password='motdepasse123',
        )
        self.user.features.add(self.webtoon_feature)
        login_response = self.client.post(
            self.login_url,
            {'username': 'melissa', 'password': 'motdepasse123'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return token

    def test_user_registration_and_login_jwt(self):
        payload = {
            'username': 'akira',
            'email': 'akira@example.com',
            'password': 'motdepassefort',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='akira').exists())

        login_response = self.client.post(
            self.login_url,
            {'username': 'akira', 'password': 'motdepassefort'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)

    def test_authenticated_user_can_crud_webtoon(self):
        self.authenticate()
        payload = {
            'title': 'Solo Leveling',
            'type': 'Manhwa',
            'language': 'Français',
            'rating': 4.5,
            'status': 'En cours',
            'chapter': 192,
            'link': 'https://example.com/solo-leveling',
            'last_read_date': '2024-10-10',
            'comment': 'Arc actuel incroyable.',
            'image_url': 'https://example.com/solo.jpg',
        }
        create_response = self.client.post(self.webtoon_list_url, payload, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        webtoon_id = create_response.data['id']
        self.assertEqual(Webtoon.objects.count(), 1)

        list_response = self.client.get(self.webtoon_list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data['count'], 1)
        self.assertEqual(len(list_response.data['results']), 1)

        detail_url = reverse('api:webtoon-detail', args=[webtoon_id])
        detail_response = self.client.get(detail_url)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data['title'], 'Solo Leveling')

        update_payload = payload | {'title': 'Solo Leveling Legacy', 'rating': 4.8}
        update_response = self.client.put(detail_url, update_payload, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['title'], 'Solo Leveling Legacy')
        self.assertEqual(Webtoon.objects.get(id=webtoon_id).title, 'Solo Leveling Legacy')

        delete_response = self.client.delete(detail_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Webtoon.objects.filter(id=webtoon_id).exists())

    def test_webtoon_is_not_visible_to_other_users(self):
        self.authenticate()
        webtoon = Webtoon.objects.create(
            title='Blue Lock',
            type='Manga',
            language='Français',
            rating=4.2,
            status='En cours',
            chapter=230,
            link='https://example.com/bluelock',
            user=self.user,
        )

        other_client = self.client.__class__()
        other_user = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='motdepasse456',
        )
        other_user.features.add(self.webtoon_feature)
        login_response = other_client.post(
            self.login_url,
            {'username': 'other', 'password': 'motdepasse456'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        token = login_response.data['access']
        other_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        list_response = other_client.get(self.webtoon_list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data['count'], 0)
        self.assertEqual(list_response.data['results'], [])

        detail_url = reverse('api:webtoon-detail', args=[webtoon.id])
        detail_response = other_client.get(detail_url)
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)
