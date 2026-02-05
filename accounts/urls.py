from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import AdminUserViewSet, FeatureViewSet, ProfileView, RegisterView

router = DefaultRouter()
router.register("admin/features", FeatureViewSet, basename="admin-features")
router.register("admin/users", AdminUserViewSet, basename="admin-users")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path(
        "login/",
        TokenObtainPairView.as_view(authentication_classes=()),
        name="login",
    ),
    path(
        "refresh/",
        TokenRefreshView.as_view(authentication_classes=()),
        name="token-refresh",
    ),
    path("me/", ProfileView.as_view(), name="profile"),
] + router.urls
