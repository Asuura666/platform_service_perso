from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Restrict access to resources owned by the authenticated user.

    Works for objects with a direct `user` attribute or with a related
    `webtoon` object that is itself owned by the authenticated user.
    """

    message = "Vous n'avez pas l'autorisation d'accéder à cette ressource."

    def has_object_permission(self, request, view, obj):
        user = getattr(obj, 'user', None)
        if user is not None:
            return user == request.user

        webtoon = getattr(obj, 'webtoon', None)
        if webtoon is not None:
            return webtoon.user == request.user

        return False
