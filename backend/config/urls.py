"""
URL configuration for backend project.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),
    path("api/jules/", include("jules.urls")),
    path("health", include("config.health.urls")),
]
