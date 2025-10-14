import hashlib

from django.conf import settings
from django.core.cache import cache
from django.db.models import Count
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import HasFeaturePermission

from .models import Chapter, Comment, Webtoon
from .permissions import IsOwner
from .serializers import ChapterSerializer, CommentSerializer, WebtoonSerializer


@extend_schema_view(
    list=extend_schema(summary="Lister les webtoons de l'utilisateur connecté"),
    retrieve=extend_schema(summary="Récupérer le détail d'un webtoon"),
    create=extend_schema(summary="Créer un nouveau webtoon"),
    update=extend_schema(summary="Mettre à jour un webtoon"),
    partial_update=extend_schema(summary="Modifier partiellement un webtoon"),
    destroy=extend_schema(summary="Supprimer un webtoon"),
)
class WebtoonViewSet(viewsets.ModelViewSet):
    """
    ViewSet principal gérant les webtoons de l'utilisateur connecté.
    """

    cache_timeout = getattr(settings, "CACHE_MIDDLEWARE_SECONDS", 300)
    serializer_class = WebtoonSerializer
    permission_classes = (IsAuthenticated, HasFeaturePermission, IsOwner)
    required_feature = "webtoon_management"

    def get_queryset(self):
        return (
            Webtoon.objects.filter(user=self.request.user)
            .select_related('user')
            .prefetch_related('chapters', 'comments')
            .annotate(
                chapters_count=Count('chapters', distinct=True),
                comments_count=Count('comments', distinct=True),
            )
            .order_by('-last_update', '-created_at')
        )

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        self._invalidate_cache(instance.user_id)

    def perform_update(self, serializer):
        instance = serializer.save(user=self.request.user)
        self._invalidate_cache(instance.user_id)

    def perform_destroy(self, instance):
        user_id = instance.user_id
        super().perform_destroy(instance)
        self._invalidate_cache(user_id)

    def list(self, request, *args, **kwargs):
        """Return the paginated list of webtoons with per-user caching."""
        queryset = self.filter_queryset(self.get_queryset())
        cache_key = self._build_list_cache_key(request.user.pk, request.get_full_path())

        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True)
            response = Response(serializer.data)

        cache.set(cache_key, response.data, self.cache_timeout)
        self._register_cache_key(request.user.pk, cache_key)
        return response

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a single webtoon and hydrate the cache."""
        cache_key = self._build_detail_cache_key(request.user.pk, kwargs.get('pk'))
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response.data, self.cache_timeout)
        self._register_cache_key(request.user.pk, cache_key)
        return response

    @extend_schema(
        summary="Lister les chapitres d'un webtoon",
        responses=ChapterSerializer(many=True),
        parameters=[
            OpenApiParameter(
                name='id',
                type=int,
                location=OpenApiParameter.PATH,
                description='Identifiant du webtoon',
            )
        ],
    )
    @extend_schema(
        methods=['POST'],
        summary="Ajouter un chapitre à un webtoon",
        request=ChapterSerializer,
        responses={201: ChapterSerializer},
    )
    @action(detail=True, methods=['get', 'post'], url_path='chapters')
    def chapters(self, request, pk=None):
        """List or create chapters belonging to a webtoon."""
        webtoon = self.get_object()
        if request.method.lower() == 'get':
            queryset = webtoon.chapters.all().order_by('chapter_number')
            cache_key = self._build_related_cache_key(
                webtoon.user_id,
                webtoon.pk,
                'chapters',
                request.get_full_path(),
            )
            cached_payload = cache.get(cache_key)
            if cached_payload is not None:
                return Response(cached_payload)

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = ChapterSerializer(page, many=True)
                response = self.get_paginated_response(serializer.data)
            else:
                serializer = ChapterSerializer(queryset, many=True)
                response = Response(serializer.data)

            cache.set(cache_key, response.data, self.cache_timeout)
            self._register_cache_key(webtoon.user_id, cache_key)
            return response

        serializer = ChapterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(webtoon=webtoon)
        self._invalidate_cache(webtoon.user_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Lister les commentaires d'un webtoon",
        responses=CommentSerializer(many=True),
        parameters=[
            OpenApiParameter(
                name='id',
                type=int,
                location=OpenApiParameter.PATH,
                description='Identifiant du webtoon',
            )
        ],
    )
    @extend_schema(
        methods=['POST'],
        summary="Ajouter un commentaire à un webtoon",
        request=CommentSerializer,
        responses={201: CommentSerializer},
    )
    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        """List or create comments belonging to a webtoon."""
        webtoon = self.get_object()
        if request.method.lower() == 'get':
            queryset = webtoon.comments.all().select_related('user').order_by('-created_at')
            cache_key = self._build_related_cache_key(
                webtoon.user_id,
                webtoon.pk,
                'comments',
                request.get_full_path(),
            )
            cached_payload = cache.get(cache_key)
            if cached_payload is not None:
                return Response(cached_payload)

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = CommentSerializer(page, many=True)
                response = self.get_paginated_response(serializer.data)
            else:
                serializer = CommentSerializer(queryset, many=True)
                response = Response(serializer.data)

            cache.set(cache_key, response.data, self.cache_timeout)
            self._register_cache_key(webtoon.user_id, cache_key)
            return response

        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(webtoon=webtoon, user=request.user)
        self._invalidate_cache(webtoon.user_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _build_list_cache_key(user_id: int, full_path: str) -> str:
        digest = hashlib.md5(full_path.encode('utf-8')).hexdigest()
        return f"webtoon:{user_id}:list:{digest}"

    @staticmethod
    def _build_detail_cache_key(user_id: int, webtoon_id: int | str) -> str:
        return f"webtoon:{user_id}:detail:{webtoon_id}"

    @staticmethod
    def _build_related_cache_key(user_id: int, webtoon_id: int, resource: str, full_path: str) -> str:
        digest = hashlib.md5(full_path.encode('utf-8')).hexdigest()
        return f"webtoon:{user_id}:{resource}:{webtoon_id}:{digest}"

    @staticmethod
    def _cache_index_key(user_id: int) -> str:
        return f"webtoon:index:{user_id}"

    def _register_cache_key(self, user_id: int, cache_key: str) -> None:
        """Persist the cache key so it can be invalidated later for the user."""
        index_key = self._cache_index_key(user_id)
        stored_keys = cache.get(index_key, [])
        if cache_key not in stored_keys:
            stored_keys.append(cache_key)
            cache.set(index_key, stored_keys, self.cache_timeout)

    def _invalidate_cache(self, user_id: int) -> None:
        """Purge all cached entries associated with the given user."""
        index_key = self._cache_index_key(user_id)
        stored_keys = cache.get(index_key, [])
        if stored_keys:
            cache.delete_many(stored_keys)
        cache.delete(index_key)
