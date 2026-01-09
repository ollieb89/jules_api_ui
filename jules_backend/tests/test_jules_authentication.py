import pytest
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.parametrize(
    "path",
    [
        "/api/jules/sources/",
        "/api/jules/sessions/",
        "/api/jules/settings/",
        "/api/jules/health/",
    ],
)
def test_unauthenticated_requests_are_rejected(path):
    client = APIClient()

    response = client.get(path)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
