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
