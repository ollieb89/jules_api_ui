from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User
from .permissions import IsProfileOwnerOrAdmin
from .serializers import UserCreateSerializer, UserSerializer, UserUpdateSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User model providing CRUD operations.

    list: Get all users (with pagination)
    retrieve: Get a specific user by ID
    create: Create a new user
    update: Update a user (full update)
    partial_update: Update a user (partial update)
    destroy: Delete a user
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAdmin]

    def get_queryset(self):
        """
        Return users.
        Regular users can only see their own profile.
        Admins can see all users.
        """
        user = self.request.user
        if user.is_staff:
            return User.objects.all()
        return User.objects.filter(email=user.email)

    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):  # noqa: ARG002
        """Create a new user."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            UserSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):  # noqa: ARG002
        """Update a user (full update)."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(UserSerializer(instance).data)

    def partial_update(self, request, *args, **kwargs):
        """Update a user (partial update)."""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)
