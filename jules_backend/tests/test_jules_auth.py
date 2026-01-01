import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
@pytest.mark.parametrize(
    "path",
    [
        "/api/jules/sources/",
        "/api/jules/sessions/",
        "/api/jules/settings/",
        "/api/jules/health/",
    ],
)
def test_jules_endpoints_require_authentication(path):
    client = APIClient()

    response = client.get(path)

    assert response.status_code == 401


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("path", "payload"),
    [
        ("/api/jules/sessions/", {"prompt": "Test", "source": "repo"}),
        ("/api/jules/settings/api-key/", {"api_key": "secret"}),
        ("/api/jules/settings/test/", None),
    ],
)
def test_jules_post_endpoints_require_authentication(path, payload):
    client = APIClient()

    response = client.post(path, data=payload, format="json")

    assert response.status_code == 401
