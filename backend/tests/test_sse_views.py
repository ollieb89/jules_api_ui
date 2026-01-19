import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


@pytest.fixture
def api_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username="tester", password="pass")
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_cached_sessions_sse_headers(api_client):
    response = api_client.get("/api/jules/sessions/cached-events/?poll_interval=1")

    assert response.status_code == 200
    assert response["Content-Type"].startswith("text/event-stream")
    assert response["Cache-Control"] == "no-cache"
    assert response["X-Accel-Buffering"] == "no"
    assert response.streaming


def test_cached_session_detail_sse_headers(api_client):
    response = api_client.get("/api/jules/sessions/1/cached-events/?poll_interval=1")

    assert response.status_code == 200
    assert response["Content-Type"].startswith("text/event-stream")
    assert response["Cache-Control"] == "no-cache"
    assert response["X-Accel-Buffering"] == "no"
    assert response.streaming


def test_sse_invalid_poll_interval(api_client):
    """Test that invalid poll_interval returns 400 Bad Request."""
    response = api_client.get("/api/jules/sessions/cached-events/?poll_interval=invalid")

    assert response.status_code == 400
    assert "poll_interval" in response.json()
