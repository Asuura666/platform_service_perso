from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.models import Feature

User = get_user_model()


class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ("id", "code", "name", "description")
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    features = serializers.SlugRelatedField(slug_field="code", read_only=True, many=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_superuser",
            "features",
        )
        read_only_fields = ("id", "role")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "role")
        read_only_fields = ("id", "role")

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=False)
    features = serializers.SlugRelatedField(
        slug_field="code",
        queryset=Feature.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "is_superuser",
            "password",
            "features",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        features = validated_data.pop("features", [])
        password = validated_data.pop("password", None)
        if not password:
            raise serializers.ValidationError({"password": "Un mot de passe est requis pour créer un compte."})
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        if features:
            user.features.set(features)
        return user

    def update(self, instance, validated_data):
        features = validated_data.pop("features", None)
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if features is not None:
            instance.features.set(features)
        return instance
