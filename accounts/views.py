from rest_framework import generics, permissions

from .models import User
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """Permet l'inscription d'un utilisateur."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


class ProfileView(generics.RetrieveAPIView):
    """Retourne le profil de l'utilisateur courant."""

    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
