import json
import time

from django.http import StreamingHttpResponse
from rest_framework import status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import (
    ActivitySerializer,
    ApiKeyUpdateSerializer,
    ApprovePlanSerializer,
    JulesActivitySerializer,
    JulesSettingsSerializer,
    SendMessageSerializer,
    SessionCreateSerializer,
    SessionSerializer,
    SyncStatusSerializer,
    SourceSerializer,
)
from .authentication import QueryParamJWTAuthentication
from .models import JulesActivity, JulesSession, JulesSettings
from .services import JulesApiClient
from .store import (
    get_cached_activities_payload,
    get_cached_sessions_payload,
    get_or_create_session_stub,
    is_activities_cache_fresh,
    is_session_fresh,
    is_sessions_cache_fresh,
    get_sync_status,
    mark_activities_synced,
    mark_sessions_synced,
    normalize_session_name,
    session_to_api_dict,
    upsert_activity_from_api,
    upsert_session_from_api,
)
from .utils import handle_api_exception


class JulesAuthenticatedViewSet(viewsets.ViewSet):
    """Base ViewSet that enforces JWT or session authentication."""

    authentication_classes = [SessionAuthentication, JWTAuthentication]
    permission_classes = [IsAuthenticated]


class SourceViewSet(JulesAuthenticatedViewSet):
    """ViewSet for listing sources (GitHub repositories)."""

    permission_classes = [IsAuthenticated]

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
            return handle_api_exception(e, request=request)


class SessionViewSet(JulesAuthenticatedViewSet):
    """ViewSet for managing Jules sessions."""

    permission_classes = [IsAuthenticated]

    @action(
        detail=False,
        methods=["get"],
        url_path="cached-events",
        authentication_classes=[SessionAuthentication, JWTAuthentication, QueryParamJWTAuthentication],
    )
    def cached_session_events(self, request):
        """Stream cached session list updates via SSE."""
        poll_interval = float(request.query_params.get("poll_interval", 20))
        last_update = request.query_params.get("last_update")

        def event_stream():
            nonlocal last_update
            while True:
                try:
                    sessions = get_cached_sessions_payload()
                    latest_update = max(
                        (session.get("updateTime") for session in sessions if session.get("updateTime")),
                        default=None,
                    )
                    if latest_update and latest_update != last_update:
                        serializer = SessionSerializer(data=sessions, many=True)
                        serializer.is_valid(raise_exception=True)
                        yield "event: sessions_update\n"
                        yield f"data: {json.dumps(serializer.data)}\n\n"
                        last_update = latest_update

                    yield "event: heartbeat\n"
                    yield "data: {}\n\n"
                except Exception as e:
                    error_payload = {"message": str(e)}
                    yield "event: error\n"
                    yield f"data: {json.dumps(error_payload)}\n\n"
                    break

                time.sleep(poll_interval)

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response

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
            upsert_session_from_api(data)
            session_serializer = SessionSerializer(data=data)
            session_serializer.is_valid(raise_exception=True)
            return Response(session_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return handle_api_exception(e, request=request)

    def list(self, request):
        """List all sessions with pagination."""
        refresh = request.query_params.get("refresh") in {"1", "true", "True"}
        if not refresh and is_sessions_cache_fresh():
            cached_sessions = get_cached_sessions_payload()
            serializer = SessionSerializer(data=cached_sessions, many=True)
            serializer.is_valid(raise_exception=True)
            return Response({"sessions": serializer.data, "next_page_token": None})
        client = JulesApiClient()
        page_size = int(request.query_params.get("page_size", 100))
        page_token = request.query_params.get("page_token")
        try:
            data = client.list_sessions(page_size=page_size, page_token=page_token)
            sessions = data.get("sessions", [])
            for session_data in sessions:
                upsert_session_from_api(session_data)
            mark_sessions_synced()
            serializer = SessionSerializer(data=sessions, many=True)
            serializer.is_valid(raise_exception=True)
            return Response(
                {
                    "sessions": serializer.data,
                    "next_page_token": data.get("nextPageToken"),
                }
            )
        except Exception as e:
            return handle_api_exception(e, request=request)

    @action(
        detail=False,
        methods=["get"],
        url_path="events",
        authentication_classes=[SessionAuthentication, JWTAuthentication, QueryParamJWTAuthentication],
    )
    def session_events(self, request):
        """Stream session list updates via SSE."""
        client = JulesApiClient()
        poll_interval = float(request.query_params.get("poll_interval", 10))
        last_update = request.query_params.get("last_update")

        def event_stream():
            nonlocal last_update
            while True:
                try:
                    data = client.list_sessions(page_size=100)
                    sessions = data.get("sessions", [])
                    if sessions:
                        for session_data in sessions:
                            upsert_session_from_api(session_data)
                        mark_sessions_synced()
                        latest_update = max(
                            (session.get("update_time") for session in sessions),
                            default=None,
                        )
                        if latest_update and latest_update != last_update:
                            serializer = SessionSerializer(data=sessions, many=True)
                            serializer.is_valid(raise_exception=True)
                            yield "event: sessions_update\n"
                            yield f"data: {json.dumps(serializer.data)}\n\n"
                            last_update = latest_update

                    yield "event: heartbeat\n"
                    yield "data: {}\n\n"
                except Exception as e:
                    error_payload = {"message": str(e)}
                    yield "event: error\n"
                    yield f"data: {json.dumps(error_payload)}\n\n"
                    break

                time.sleep(poll_interval)

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response

    def retrieve(self, request, pk=None):  # noqa: ARG002
        """Get a specific session by ID."""
        refresh = request.query_params.get("refresh") in {"1", "true", "True"}
        session_name = normalize_session_name(pk)
        if not refresh:
            try:
                cached_session = JulesSession.objects.get(name=session_name)
            except JulesSession.DoesNotExist:
                cached_session = None
            if cached_session and is_session_fresh(cached_session):
                payload = session_to_api_dict(cached_session)
                serializer = SessionSerializer(data=payload)
                serializer.is_valid(raise_exception=True)
                return Response(serializer.data)
        client = JulesApiClient()
        try:
            data = client.get_session(pk)
            upsert_session_from_api(data)
            serializer = SessionSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            return Response(serializer.data)
        except Exception as e:
            return handle_api_exception(e, request=request)

    def destroy(self, request, pk=None):  # noqa: ARG002
        """Delete a session."""
        client = JulesApiClient()
        try:
            client.delete_session(pk)
            session_name = normalize_session_name(pk)
            JulesSession.objects.filter(name=session_name).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return handle_api_exception(e, request=request)

    @action(detail=True, methods=["post"])
    def approve_plan(self, request, pk=None):  # noqa: ARG002
        """Approve a generated plan."""
        serializer = ApprovePlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = JulesApiClient()
        try:
            data = client.approve_plan(pk)
            upsert_session_from_api(data)
            session_serializer = SessionSerializer(data=data)
            session_serializer.is_valid(raise_exception=True)
            return Response(session_serializer.data)
        except Exception as e:
            return handle_api_exception(e, request=request)

    @action(detail=True, methods=["post"])
    def send_message(self, request, pk=None):  # noqa: ARG002
        """Send a message to the agent."""
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = JulesApiClient()
        try:
            data = client.send_message(pk, serializer.validated_data["message"])
            upsert_session_from_api(data)
            session_serializer = SessionSerializer(data=data)
            session_serializer.is_valid(raise_exception=True)
            return Response(session_serializer.data)
        except Exception as e:
            return handle_api_exception(e, request=request)

    @action(detail=True, methods=["get"])
    def activities(self, request, pk=None):  # noqa: ARG002
        """List activities for a session."""
        refresh = request.query_params.get("refresh") in {"1", "true", "True"}
        session_name = normalize_session_name(pk)
        if not refresh and is_activities_cache_fresh(session_name):
            cached_activities = get_cached_activities_payload(session_name)
            serializer = ActivitySerializer(data=cached_activities, many=True)
            serializer.is_valid(raise_exception=True)
            return Response({"activities": serializer.data, "next_page_token": None})
        client = JulesApiClient()
        page_size = int(request.query_params.get("page_size", 100))
        page_token = request.query_params.get("page_token")
        try:
            data = client.list_activities(
                session_id=pk, page_size=page_size, page_token=page_token
            )
            activities = data.get("activities", [])
            session = get_or_create_session_stub(session_name)
            for activity in activities:
                upsert_activity_from_api(session, activity)
            mark_activities_synced(session_name)
            serializer = ActivitySerializer(data=activities, many=True)
            serializer.is_valid(raise_exception=True)
            return Response(
                {
                    "activities": serializer.data,
                    "next_page_token": data.get("nextPageToken"),
                }
            )
        except Exception as e:
            return handle_api_exception(e, request=request)

    @action(
        detail=True,
        methods=["get"],
        url_path="cached-events",
        authentication_classes=[SessionAuthentication, JWTAuthentication, QueryParamJWTAuthentication],
    )
    def cached_events(self, request, pk=None):  # noqa: ARG002
        """Stream cached session/activity updates via SSE."""
        poll_interval = float(request.query_params.get("poll_interval", 15))
        session_name = normalize_session_name(pk)
        last_update = request.query_params.get("last_update")
        last_activity_id_param = request.query_params.get("last_activity_id")
        last_activity_id = int(last_activity_id_param) if last_activity_id_param else None

        def get_latest_activity_id() -> int | None:
            latest_activity = (
                JulesActivity.objects.filter(session__name=session_name).order_by("-id").first()
            )
            return latest_activity.id if latest_activity else None

        def event_stream():
            nonlocal last_update, last_activity_id
            if last_activity_id is None:
                last_activity_id = get_latest_activity_id()
            while True:
                try:
                    session = JulesSession.objects.filter(name=session_name).first()
                    if session:
                        payload = session_to_api_dict(session)
                        session_update_time = payload.get("updateTime")
                        if session_update_time and session_update_time != last_update:
                            serializer = SessionSerializer(data=payload)
                            serializer.is_valid(raise_exception=True)
                            yield "event: session_update\n"
                            yield f"data: {json.dumps(serializer.data)}\n\n"
                            last_update = session_update_time

                    latest_activity_id = get_latest_activity_id()
                    if latest_activity_id and latest_activity_id != last_activity_id:
                        yield "event: activity_update\n"
                        yield f"data: {json.dumps({'latest_activity_id': latest_activity_id})}\n\n"
                        last_activity_id = latest_activity_id

                    yield "event: heartbeat\n"
                    yield "data: {}\n\n"
                except Exception as e:
                    error_payload = {"message": str(e)}
                    yield "event: error\n"
                    yield f"data: {json.dumps(error_payload)}\n\n"
                    break

                time.sleep(poll_interval)

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response

    @action(
        detail=True,
        methods=["get"],
        url_path="events",
        authentication_classes=[SessionAuthentication, JWTAuthentication, QueryParamJWTAuthentication],
    )
    def events(self, request, pk=None):  # noqa: ARG002
        """Stream session/activity updates via SSE."""
        client = JulesApiClient()
        poll_interval = float(request.query_params.get("poll_interval", 5))
        last_update = request.query_params.get("last_update")
        last_activity_time = request.query_params.get("last_activity_time")

        def event_stream():
            nonlocal last_update, last_activity_time
            while True:
                try:
                    session_data = client.get_session(pk)
                    session = upsert_session_from_api(session_data)
                    session_serializer = SessionSerializer(data=session_data)
                    session_serializer.is_valid(raise_exception=True)
                    session_payload = session_serializer.data
                    session_update_time = session_payload.get("update_time")

                    if session_update_time and session_update_time != last_update:
                        yield "event: session_update\n"
                        yield f"data: {json.dumps(session_payload)}\n\n"
                        last_update = session_update_time

                    activities_data = client.list_activities(session_id=pk, page_size=20)
                    activities = activities_data.get("activities", [])
                    if activities:
                        for activity in activities:
                            upsert_activity_from_api(session, activity)
                        mark_activities_synced(normalize_session_name(pk))
                        latest_activity_time = max(
                            (activity.get("create_time") for activity in activities),
                            default=None,
                        )
                        if latest_activity_time and latest_activity_time != last_activity_time:
                            activity_serializer = ActivitySerializer(data=activities, many=True)
                            activity_serializer.is_valid(raise_exception=True)
                            yield "event: activity_update\n"
                            yield f"data: {json.dumps(activity_serializer.data)}\n\n"
                            last_activity_time = latest_activity_time

                    yield "event: heartbeat\n"
                    yield "data: {}\n\n"
                except Exception as e:
                    error_payload = {"message": str(e)}
                    yield "event: error\n"
                    yield f"data: {json.dumps(error_payload)}\n\n"
                    break

                time.sleep(poll_interval)

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response

    @action(detail=True, methods=["get"], url_path="activity-stream")
    def activity_stream(self, request, pk=None):  # noqa: ARG002
        """Stream cached activities for a session using SSE."""
        last_event_id = request.headers.get("Last-Event-ID")
        if not last_event_id:
            last_event_id = request.query_params.get("last_event_id")
        heartbeat = int(request.query_params.get("heartbeat", 15))
        session_name = normalize_session_name(pk)

        def event_generator():
            yield "retry: 5000\n\n"
            last_seen = int(last_event_id) if last_event_id and last_event_id.isdigit() else 0
            while True:
                activities = (
                    JulesActivity.objects.filter(session__name=session_name, id__gt=last_seen)
                    .order_by("id")[:100]
                )
                for activity in activities:
                    payload = JulesActivitySerializer(activity).data
                    yield f"id: {activity.id}\n"
                    yield "event: activity\n"
                    yield f"data: {json.dumps(payload)}\n\n"
                    last_seen = activity.id
                time.sleep(heartbeat)

        response = StreamingHttpResponse(event_generator(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        return response


class JulesHealthViewSet(JulesAuthenticatedViewSet):
    """ViewSet for Jules API health check."""

    permission_classes = [IsAuthenticated]

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


class SettingsViewSet(JulesAuthenticatedViewSet):
    """ViewSet for managing Jules settings (API key configuration)."""

    permission_classes = [IsAuthenticated]

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
            return handle_api_exception(e, request=request)

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


class SyncStatusViewSet(JulesAuthenticatedViewSet):
    """ViewSet for background sync status."""

    permission_classes = [IsAuthenticated]

    def list(self, request):  # noqa: ARG002
        """Return the latest background sync status."""
        status_payload = get_sync_status()
        serializer = SyncStatusSerializer(data=status_payload)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="events",
        authentication_classes=[SessionAuthentication, JWTAuthentication, QueryParamJWTAuthentication],
    )
    def events(self, request):
        """Stream background sync status updates via SSE."""
        poll_interval = float(request.query_params.get("poll_interval", 5))
        last_update = request.query_params.get("last_update")

        def event_stream():
            nonlocal last_update
            while True:
                try:
                    status_payload = get_sync_status()
                    updated_at = status_payload.get("updated_at")
                    if updated_at and updated_at != last_update:
                        serializer = SyncStatusSerializer(data=status_payload)
                        serializer.is_valid(raise_exception=True)
                        yield "event: sync_status\n"
                        yield f"data: {json.dumps(serializer.data)}\n\n"
                        last_update = updated_at

                    yield "event: heartbeat\n"
                    yield "data: {}\n\n"
                except Exception as e:
                    error_payload = {"message": str(e)}
                    yield "event: error\n"
                    yield f"data: {json.dumps(error_payload)}\n\n"
                    break

                time.sleep(poll_interval)

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response
