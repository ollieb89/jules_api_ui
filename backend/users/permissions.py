from rest_framework import permissions


class IsProfileOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object or admins to access it.
    Assumes the object has an 'email' field that matches the request.user.email.
    """

    def has_object_permission(self, request, view, obj):
        # Admins can do anything
        if request.user.is_staff:
            return True

        # Regular users can only access their own profile (Read & Write)
        # request.user is django.contrib.auth.models.User
        # obj is users.models.User
        return request.user.email == obj.email
