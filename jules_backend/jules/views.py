from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import (
    ActivitySerializer,
    ApprovePlanSerializer,
    SendMessageSerializer,
    SessionCreateSerializer,
    SessionSerializer,
    SourceSerializer,
)
from .services import JulesApiClient


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
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, pk=None):  # noqa: ARG002
        """Get a specific session by ID."""
        client = JulesApiClient()
        try:
            data = client.get_session(pk)
            serializer = SessionSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, pk=None):  # noqa: ARG002
        """Delete a session."""
        client = JulesApiClient()
        try:
            client.delete_session(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
