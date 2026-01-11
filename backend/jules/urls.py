from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    JulesHealthViewSet,
    SessionViewSet,
    SettingsViewSet,
    SourceViewSet,
    SyncStatusViewSet,
)

router = DefaultRouter()
router.register(r"sources", SourceViewSet, basename="source")
router.register(r"sessions", SessionViewSet, basename="session")
router.register(r"settings", SettingsViewSet, basename="settings")
router.register(r"health", JulesHealthViewSet, basename="jules-health")
router.register(r"sync", SyncStatusViewSet, basename="sync-status")

urlpatterns = [
    path("", include(router.urls)),
]
