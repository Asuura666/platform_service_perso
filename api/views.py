from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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

    serializer_class = WebtoonSerializer
    permission_classes = (IsAuthenticated, IsOwner)

    def get_queryset(self):
        return (
            Webtoon.objects.filter(user=self.request.user)
            .select_related('user')
            .prefetch_related('chapters', 'comments')
            .order_by('-last_update', '-created_at')
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

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
        webtoon = self.get_object()
        if request.method.lower() == 'get':
            serializer = ChapterSerializer(webtoon.chapters.all().order_by('chapter_number'), many=True)
            return Response(serializer.data)

        serializer = ChapterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(webtoon=webtoon)
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
        webtoon = self.get_object()
        if request.method.lower() == 'get':
            serializer = CommentSerializer(webtoon.comments.all().select_related('user'), many=True)
            return Response(serializer.data)

        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(webtoon=webtoon, user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
