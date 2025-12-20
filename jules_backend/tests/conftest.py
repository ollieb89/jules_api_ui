import pytest
from django.test import Client


@pytest.fixture
def client():
    """Django test client fixture."""
    return Client()


@pytest.fixture
def api_client(client):
    """API test client with JSON content type."""
    return Client(HTTP_ACCEPT="application/json", HTTP_CONTENT_TYPE="application/json")
