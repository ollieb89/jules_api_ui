from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import (
    ActivitySerializer,
    ApiKeyUpdateSerializer,
    ApprovePlanSerializer,
    JulesSettingsSerializer,
    SendMessageSerializer,
    SessionCreateSerializer,
    SessionSerializer,
    SourceSerializer,
)
from .models import JulesSettings
from .services import JulesApiClient
from .utils import handle_api_exception


class SourceViewSet(viewsets.ViewSet):
    """ViewSet for listing sources (GitHub repositories)."""

    def list(self, request):  # noqa: ARG002
        """List all connected GitHub repositories."""
        client = JulesApiClient()
        try:
            data = client.list_sources()
            sources = data.get("sources", [])
            serializer = SourceSerializer(data=sources, many=True)
            serializer.is_valid(raise_exception=True)
            return Response({"sources": serializer.data})
        except Exception as e:
            return handle_api_exception(e)


class SessionViewSet(viewsets.ViewSet):
    """ViewSet for managing Jules sessions."""

    def create(self, request):
        """Create a new coding session."""
        serializer = SessionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = JulesApiClient()
        try:
            data = client.create_session(
                prompt=serializer.validated_data["prompt"],
                source=serializer.validated_data["source"],
            )
            session_serializer = SessionSerializer(data=data)
            session_serializer.is_valid(raise_exception=True)
            return Response(session_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return handle_api_exception(e)

    def list(self, request):
        """List all sessions with pagination."""
        client = JulesApiClient()
        page_size = int(request.query_params.get("page_size", 100))
        page_token = request.query_params.get("page_token")
        try:
            data = client.list_sessions(page_size=page_size, page_token=page_token)
            sessions = data.get("sessions", [])
            serializer = SessionSerializer(data=sessions, many=True)
            serializer.is_valid(raise_exception=True)
            return Response(
                {
                    "sessions": serializer.data,
                    "next_page_token": data.get("nextPageToken"),
                }
            )
        except Exception as e:
            return handle_api_exception(e)

    def retrieve(self, request, pk=None):  # noqa: ARG002
        """Get a specific session by ID."""
        client = JulesApiClient()
        try:
            data = client.get_session(pk)
            serializer = SessionSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            return Response(serializer.data)
        except Exception as e:
            return handle_api_exception(e)

    def destroy(self, request, pk=None):  # noqa: ARG002
        """Delete a session."""
        client = JulesApiClient()
        try:
            client.delete_session(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return handle_api_exception(e)

    @action(detail=True, methods=["post"])
    def approve_plan(self, request, pk=None):  # noqa: ARG002
        """Approve a generated plan."""
        serializer = ApprovePlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = JulesApiClient()
        try:
            data = client.approve_plan(pk)
            session_serializer = SessionSerializer(data=data)
            session_serializer.is_valid(raise_exception=True)
            return Response(session_serializer.data)
        except Exception as e:
            return handle_api_exception(e)

    @action(detail=True, methods=["post"])
    def send_message(self, request, pk=None):  # noqa: ARG002
        """Send a message to the agent."""
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = JulesApiClient()
        try:
            data = client.send_message(pk, serializer.validated_data["message"])
            session_serializer = SessionSerializer(data=data)
            session_serializer.is_valid(raise_exception=True)
            return Response(session_serializer.data)
        except Exception as e:
            return handle_api_exception(e)

    @action(detail=True, methods=["get"])
    def activities(self, request, pk=None):  # noqa: ARG002
        """List activities for a session."""
        client = JulesApiClient()
        page_size = int(request.query_params.get("page_size", 100))
        page_token = request.query_params.get("page_token")
        try:
            data = client.list_activities(
                session_id=pk, page_size=page_size, page_token=page_token
            )
            activities = data.get("activities", [])
            serializer = ActivitySerializer(data=activities, many=True)
            serializer.is_valid(raise_exception=True)
            return Response(
                {
                    "activities": serializer.data,
                    "next_page_token": data.get("nextPageToken"),
                }
            )
        except Exception as e:
            return handle_api_exception(e)


class JulesHealthViewSet(viewsets.ViewSet):
    """ViewSet for Jules API health check."""

    def list(self, request):  # noqa: ARG002
        """Check Jules API connectivity and configuration."""
        try:
            client = JulesApiClient()
            # Test API connectivity by listing sources (lightweight call)
            data = client.list_sources()
            return Response(
                {
                    "status": "ok",
                    "api_key_configured": True,
                    "api_connectivity": "ok",
                    "sources_count": len(data.get("sources", [])),
                },
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            # API key not configured
            return Response(
                {
                    "status": "error",
                    "api_key_configured": False,
                    "error": str(e),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as e:
            # API connectivity issue
            return Response(
                {
                    "status": "error",
                    "api_key_configured": True,
                    "api_connectivity": "failed",
                    "error": str(e),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class SettingsViewSet(viewsets.ViewSet):
    """ViewSet for managing Jules settings (API key configuration)."""

    def list(self, request):  # noqa: ARG002
        """Get current settings (masked API key)."""
        settings = JulesSettings.get_settings()
        serializer = JulesSettingsSerializer({
            "api_key_configured": bool(settings.get_api_key()),
            "masked_api_key": settings.get_masked_api_key(),
            "created_at": settings.created_at,
            "updated_at": settings.updated_at,
        })
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="api-key")
    def update_api_key(self, request):
        """Update the API key."""
        serializer = ApiKeyUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        settings = JulesSettings.get_settings()
        try:
            settings.set_api_key(serializer.validated_data["api_key"])
            settings.save()
            
            return Response(
                {
                    "status": "success",
                    "message": "API key updated successfully",
                    "masked_api_key": settings.get_masked_api_key(),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return handle_api_exception(e)

    @action(detail=False, methods=["post"], url_path="test")
    def test_connection(self, request):  # noqa: ARG002
        """Test API connection with current settings."""
        settings = JulesSettings.get_settings()
        api_key = settings.get_api_key()
        
        if not api_key:
            return Response(
                {
                    "status": "error",
                    "message": "API key not configured",
                    "api_key_configured": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            client = JulesApiClient()
            # Test by listing sources (lightweight call)
            data = client.list_sources()
            return Response(
                {
                    "status": "success",
                    "message": "Connection successful",
                    "api_key_configured": True,
                    "api_connectivity": "ok",
                    "sources_count": len(data.get("sources", [])),
                },
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response(
                {
                    "status": "error",
                    "message": "API key is invalid or not configured",
                    "api_key_configured": False,
                    "error": str(e),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {
                    "status": "error",
                    "message": "Connection failed",
                    "api_key_configured": True,
                    "api_connectivity": "failed",
                    "error": str(e),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
