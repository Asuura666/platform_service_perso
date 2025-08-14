import logging
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import decorators, filters, permissions, response, status, viewsets

from .models import Chapter, Content, FeatureCategory, UserProgress
from .serializers import (
    ChapterSerializer,
    ContentSerializer,
    FeatureCategorySerializer,
    UserProgressSerializer,
)

logger = logging.getLogger(__name__)

# -------- Categories --------
class FeatureCategoryViewSet(viewsets.ModelViewSet):
    queryset = FeatureCategory.objects.all()
    serializer_class = FeatureCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name"]

# -------- Contents --------
class ContentViewSet(viewsets.ModelViewSet):
    queryset = Content.objects.select_related("feature_category").all()
    serializer_class = ContentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ["title", "description", "author", "language", "status", "feature_category__name"]
    ordering_fields = ["title", "created_at", "updated_at", "rating"]
    filterset_fields = ["feature_category", "status", "language"]

    # Un peu de trace pour diagnostiquer les updates “200 mais pas d’effet”
    def update(self, request, *args, **kwargs):
        logger.info("UPDATE Content pk=%s data=%s", kwargs.get("pk"), request.data)
        resp = super().update(request, *args, **kwargs)
        logger.info("UPDATE OK Content pk=%s", kwargs.get("pk"))
        return resp

    def partial_update(self, request, *args, **kwargs):
        logger.info("PATCH Content pk=%s data=%s", kwargs.get("pk"), request.data)
        resp = super().partial_update(request, *args, **kwargs)
        logger.info("PATCH OK Content pk=%s", kwargs.get("pk"))
        return resp

    @decorators.action(
        detail=True,
        methods=["GET"],
        url_path="my-progress",
        permission_classes=[permissions.AllowAny],
    )
    def my_progress(self, request, pk=None):
        if not request.user or not request.user.is_authenticated:
            return response.Response({"last_chapter": None, "last_read_at": None})
        try:
            up = UserProgress.objects.get(user=request.user, content_id=pk)
            return response.Response(UserProgressSerializer(up).data)
        except UserProgress.DoesNotExist:
            return response.Response({"last_chapter": None, "last_read_at": None})

    @decorators.action(
        detail=True,
        methods=["POST"],
        url_path="progress",
        permission_classes=[permissions.IsAuthenticated],
    )
    def progress(self, request, pk=None):
        """
        Met à jour la progression perso :
          - {"delta": +1 | -1}
          - {"chapter": "268"}
          - {"last_read_at": "2025-08-11T12:34:56Z"} (optionnel)
        """
        up, _ = UserProgress.objects.get_or_create(user=request.user, content_id=pk)

        delta = int(request.data.get("delta", 0))
        chapter = request.data.get("chapter")
        when = request.data.get("last_read_at")

        # chapitre
        if chapter not in (None, ""):
            try:
                up.last_chapter = int(chapter)
            except (TypeError, ValueError):
                up.last_chapter = None
        elif delta:
            try:
                cur = int(up.last_chapter or 0)
            except (TypeError, ValueError):
                cur = 0
            cur = max(0, cur + delta)
            up.last_chapter = cur

        # date
        if when:
            dt = parse_datetime(when)
            if not dt:
                try:
                    y, m, d = map(int, when.split("-"))
                    from datetime import datetime
                    dt = timezone.make_aware(datetime(y, m, d, 12, 0))
                except Exception:
                    dt = timezone.now()
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, timezone.get_current_timezone())
            up.last_read_at = dt
        else:
            up.last_read_at = timezone.now()

        up.save()
        return response.Response(UserProgressSerializer(up).data, status=status.HTTP_200_OK)

# -------- Chapters --------
class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.select_related("content").all()
    serializer_class = ChapterSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ["content"]

# -------- User progress --------
class UserProgressViewSet(viewsets.ModelViewSet):
    queryset = UserProgress.objects.select_related("content", "user").all()
    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_staff:
            qs = qs.filter(user=self.request.user)
        cid = self.request.query_params.get("content")
        if cid:
            qs = qs.filter(content_id=cid)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @decorators.action(detail=False, methods=["GET"], permission_classes=[permissions.AllowAny])
    def mine(self, request):
        if not request.user or not request.user.is_authenticated:
            return response.Response([])
        ser = self.get_serializer(self.get_queryset(), many=True)
        return response.Response(ser.data)
