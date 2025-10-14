from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema, extend_schema_view

from accounts.permissions import HasFeaturePermission
from scraper.models import ScrapeJob
from scraper.serializers import ScrapeJobSerializer, ScrapeRequestSerializer
from scraper.tasks import enqueue_scrape


@extend_schema_view(
    post=extend_schema(
        request=ScrapeRequestSerializer,
        responses={202: ScrapeJobSerializer},
        description="Lance le scraping d'un webtoon et retourne l'identifiant de la tâche créée.",
    )
)
class ScrapeLaunchView(APIView):
    permission_classes = (permissions.IsAuthenticated, HasFeaturePermission)
    required_feature = "scraper_access"

    def post(self, request):
        serializer = ScrapeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        job = ScrapeJob.objects.create(
            user=request.user,
            url=serializer.validated_data['url'],
            status=ScrapeJob.Status.PENDING,
        )
        enqueue_scrape(job.pk)

        output = ScrapeJobSerializer(job)
        return Response(output.data, status=status.HTTP_202_ACCEPTED)


@extend_schema(
    responses=ScrapeJobSerializer,
    description="Retourne le statut courant d'un scraping.",
)
class ScrapeStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated, HasFeaturePermission)
    required_feature = "scraper_access"

    def get(self, request, pk: int):
        job = ScrapeJob.objects.filter(user=request.user, pk=pk).first()
        if not job:
            return Response({'detail': 'Scrape introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ScrapeJobSerializer(job).data)


@extend_schema(
    responses=ScrapeJobSerializer(many=True),
    description="Historique des scrapes exécutés par l'utilisateur courant.",
)
class ScrapeHistoryView(APIView):
    permission_classes = (permissions.IsAuthenticated, HasFeaturePermission)
    required_feature = "scraper_access"

    def get(self, request):
        jobs = ScrapeJob.objects.filter(user=request.user).order_by('-created_at')[:20]
        return Response(ScrapeJobSerializer(jobs, many=True).data)
