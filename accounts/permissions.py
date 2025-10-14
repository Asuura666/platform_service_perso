"""Custom permissions related to user roles and feature flags."""

from rest_framework.permissions import BasePermission


class IsSuperUser(BasePermission):
    """Allow access only to Django superusers."""

    message = "Seuls les superutilisateurs peuvent accéder à cette ressource."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_superuser)


class HasFeaturePermission(BasePermission):
    """
    Gate access to a view/object behind a feature flag.

    The view should expose a `required_feature` attribute containing the feature code.
    Superusers automatically bypass the check.
    """

    message = "Vous n'avez pas accès à cette fonctionnalité."

    def has_permission(self, request, view):
        feature_code = getattr(view, "required_feature", None)
        if not feature_code:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.has_feature(feature_code)

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)
