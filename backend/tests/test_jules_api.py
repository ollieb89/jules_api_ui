import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient

from jules.models import JulesSettings
from jules.store import mark_sync_running


@pytest.fixture
def api_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(
        username="tester", password="pass", is_staff=True
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def anon_client():
    return APIClient()


def test_sources_list_serializes_github_metadata(api_client, monkeypatch):
    class StubClient:
        def list_sources(self):
            return {
                "sources": [
                    {
                        "name": "sources/123",
                        "displayName": "Demo Repo",
                        "githubMetadata": {
                            "repository": "octo/demo",
                            "branch": "main",
                            "commit": "abc123",
                        },
                    }
                ]
            }

    monkeypatch.setattr("jules.views.JulesApiClient", lambda: StubClient())

    response = api_client.get("/api/jules/sources/")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload["sources"] == [
        {
            "name": "sources/123",
            "display_name": "Demo Repo",
            "github_metadata": {
                "repository": "octo/demo",
                "branch": "main",
                "commit": "abc123",
            },
        }
    ]


def test_sources_list_handles_error(api_client, monkeypatch):
    class StubClient:
        def list_sources(self):
            raise RuntimeError("boom")

    monkeypatch.setattr("jules.views.JulesApiClient", lambda: StubClient())

    with override_settings(DEBUG=True):
        response = api_client.get("/api/jules/sources/")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    payload = response.json()
    assert payload["error"]["message"] == "boom"


def test_sessions_list_pagination(api_client, monkeypatch):
    captured = {}

    class StubClient:
        def list_sessions(self, page_size, page_token):
            captured["page_size"] = page_size
            captured["page_token"] = page_token
            return {
                "sessions": [
                    {
                        "name": "sessions/1",
                        "displayName": "Session One",
                        "state": "ACTIVE",
                        "prompt": "Do work",
                        "source": "sources/123",
                        "createTime": "2024-01-01T00:00:00Z",
                        "updateTime": "2024-01-02T00:00:00Z",
                    }
                ],
                "nextPageToken": "next-token",
            }

    monkeypatch.setattr("jules.views.JulesApiClient", lambda: StubClient())

    response = api_client.get("/api/jules/sessions/?page_size=2&page_token=token-1")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert captured == {"page_size": 2, "page_token": "token-1"}
    assert payload["next_page_token"] == "next-token"
    assert payload["sessions"] == [
        {
            "name": "sessions/1",
            "display_name": "Session One",
            "state": "ACTIVE",
            "prompt": "Do work",
            "source": "sources/123",
            "create_time": "2024-01-01T00:00:00Z",
            "update_time": "2024-01-02T00:00:00Z",
        }
    ]


def test_activities_list_pagination_and_serializers(api_client, monkeypatch):
    class StubClient:
        def list_activities(self, session_id, page_size, page_token):
            assert session_id == "1"
            assert page_size == 1
            assert page_token == "page-1"
            return {
                "activities": [
                    {
                        "name": "sessions/1/activities/1",
                        "planGenerated": {
                            "plan": {
                                "steps": [
                                    {
                                        "title": "",
                                        "description": "Do the thing. Then validate.",
                                        "state": "INVALID",
                                    }
                                ],
                                "state": "INVALID",
                            }
                        },
                        "createTime": "2024-01-01T00:00:00Z",
                    }
                ],
                "nextPageToken": "page-2",
            }

    monkeypatch.setattr("jules.views.JulesApiClient", lambda: StubClient())

    response = api_client.get(
        "/api/jules/sessions/1/activities/?page_size=1&page_token=page-1"
    )

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload["next_page_token"] == "page-2"
    activity = payload["activities"][0]
    assert activity["name"] == "sessions/1/activities/1"
    assert activity["plan_generated"]["plan"]["state"] == "STATE_UNSPECIFIED"
    assert activity["plan_generated"]["plan"]["steps"] == [
        {
            "id": "",
            "index": None,
            "title": "Do the thing",
            "description": "Do the thing. Then validate.",
            "state": "STATE_UNSPECIFIED",
            "artifacts": [],
        }
    ]


def test_settings_list_and_update_api_key(api_client):
    settings_obj = JulesSettings.get_settings()
    settings_obj.set_api_key("secret-api-key-1234")
    settings_obj.save()

    list_response = api_client.get("/api/jules/settings/")

    assert list_response.status_code == status.HTTP_200_OK
    list_payload = list_response.json()
    assert list_payload["api_key_configured"] is True
    assert list_payload["masked_api_key"] == "secr...1234"

    update_response = api_client.post(
        "/api/jules/settings/api-key/",
        data={"api_key": "updated-api-key-5678"},
        format="json",
    )

    assert update_response.status_code == status.HTTP_200_OK
    update_payload = update_response.json()
    assert update_payload["status"] == "success"
    assert update_payload["masked_api_key"] == "upda...5678"


def test_settings_test_connection_success(api_client, monkeypatch):
    settings_obj = JulesSettings.get_settings()
    settings_obj.set_api_key("connection-key-9999")
    settings_obj.save()

    class StubClient:
        def list_sources(self):
            return {"sources": [{"name": "sources/1"}]}

    monkeypatch.setattr("jules.views.JulesApiClient", lambda: StubClient())

    response = api_client.post("/api/jules/settings/test/")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["api_key_configured"] is True
    assert payload["sources_count"] == 1


def test_sync_status_list(api_client):
    mark_sync_running()

    response = api_client.get("/api/jules/sync/")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload["state"] == "running"
    assert payload["sessions"] == 0
    assert payload["new_activities"] == 0


def test_settings_requires_authentication(anon_client, db):
    response = anon_client.get("/api/jules/settings/")

    # Depending on DRF settings, this might be 403 Forbidden or 401 Unauthorized
    # The default IsAuthenticated permission class returns 403 when user is not authenticated
    assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


def test_settings_actions_require_authentication(anon_client, db):
    update_response = anon_client.post(
        "/api/jules/settings/api-key/",
        data={"api_key": "not-allowed"},
        format="json",
    )
    test_response = anon_client.post("/api/jules/settings/test/")

    assert update_response.status_code in [
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    ]
    assert test_response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


def test_sessions_require_authentication(anon_client, db):
    response = anon_client.get("/api/jules/sessions/")

    assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


def test_session_create_requires_authentication(anon_client, db):
    response = anon_client.post(
        "/api/jules/sessions/",
        data={"prompt": "Hi", "source": "sources/1"},
        format="json",
    )

    assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
