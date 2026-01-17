from rest_framework import permissions


class IsProfileOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to access it.
    Assumes the model instance has an `email` attribute that matches the user's email.
    """

    def has_object_permission(self, request, view, obj):
        # Admin can do anything
        if request.user.is_staff:
            return True

        # Instance must have an email attribute that matches the request user's email.
        return getattr(obj, "email", None) == request.user.email
