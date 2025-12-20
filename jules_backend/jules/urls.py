from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import JulesHealthViewSet, SessionViewSet, SettingsViewSet, SourceViewSet

router = DefaultRouter()
router.register(r"sources", SourceViewSet, basename="source")
router.register(r"sessions", SessionViewSet, basename="session")
router.register(r"settings", SettingsViewSet, basename="settings")
router.register(r"health", JulesHealthViewSet, basename="jules-health")

urlpatterns = [
    path("", include(router.urls)),
]

