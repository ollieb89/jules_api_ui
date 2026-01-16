from rest_framework import permissions


class IsProfileOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object or admins to edit it.
    Assumes the object has an 'email' field that matches the request.user.email.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner or admin.
        if request.user.is_staff:
            return True

        # Check if the user's email matches the object's email
        # request.user is django.contrib.auth.models.User
        # obj is users.models.User
        return request.user.email == obj.email
