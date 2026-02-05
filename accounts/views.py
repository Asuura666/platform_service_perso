from rest_framework import generics, permissions, viewsets

from .models import Feature, User
from .permissions import IsSuperUser
from .serializers import (
    AdminUserSerializer,
    FeatureSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    """Permet l'inscription d'un utilisateur."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Retourne et met à jour le profil de l'utilisateur courant."""

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class FeatureViewSet(viewsets.ModelViewSet):
    """Gestion des fonctionnalités disponibles sur la plateforme (réservé aux superusers)."""

    queryset = Feature.objects.all().order_by("name")
    serializer_class = FeatureSerializer
    permission_classes = (IsSuperUser,)


class AdminUserViewSet(viewsets.ModelViewSet):
    """CRUD complet des comptes utilisateurs pour l'administrateur."""

    queryset = User.objects.all().prefetch_related("features").order_by("username")
    serializer_class = AdminUserSerializer
    permission_classes = (IsSuperUser,)
