import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("method", "path", "payload"),
    [
        ("get", "/api/jules/sources/", None),
        ("get", "/api/jules/sessions/", None),
        ("post", "/api/jules/sessions/", {"prompt": "hi", "source": "repo"}),
        ("get", "/api/jules/sessions/abc123/", None),
        ("delete", "/api/jules/sessions/abc123/", None),
        ("post", "/api/jules/sessions/abc123/approve_plan/", {"approved": True}),
        ("post", "/api/jules/sessions/abc123/send_message/", {"message": "hello"}),
        ("get", "/api/jules/sessions/abc123/activities/", None),
        ("get", "/api/jules/settings/", None),
        ("post", "/api/jules/settings/api-key/", {"api_key": "key"}),
        ("post", "/api/jules/settings/test/", {}),
        ("get", "/api/jules/health/", None),
    ],
)
def test_jules_endpoints_require_authentication(method, path, payload):
    client = APIClient()

    response = getattr(client, method)(path, data=payload, format="json")

    assert response.status_code == 401
