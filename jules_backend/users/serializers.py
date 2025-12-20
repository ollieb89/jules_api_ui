from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model (response)."""

    class Meta:  # noqa: RUF012
        model = User
        fields = ["id", "name", "email", "created_at"]
        read_only_fields = ["id", "created_at"]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new user."""

    class Meta:  # noqa: RUF012
        model = User
        fields = ["name", "email"]

    def validate_email(self, value):
        """Validate that email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a user (all fields optional)."""

    class Meta:  # noqa: RUF012
        model = User
        fields = ["name", "email"]

    def validate_email(self, value):
        """Validate that email is unique (excluding current instance)."""
        queryset = User.objects.filter(email=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Email already registered")
        return value
