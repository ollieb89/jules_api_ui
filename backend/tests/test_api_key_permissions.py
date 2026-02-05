import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from jules.models import JulesSettings

User = get_user_model()


@pytest.fixture
def regular_client(db):
    user = User.objects.create_user(username="regular", password="pass")
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def admin_client(db):
    user = User.objects.create_user(username="admin", password="pass", is_staff=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_regular_user_cannot_update_api_key(regular_client):
    """
    A regular user cannot update the API key.
    """
    settings = JulesSettings.get_settings()
    settings.set_api_key("original-key")
    settings.save()

    response = regular_client.post(
        "/api/jules/settings/api-key/",
        data={"api_key": "hacked-key"},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN

    settings.refresh_from_db()
    assert settings.get_api_key() == "original-key"


def test_admin_user_can_update_api_key(admin_client):
    """
    Admin user should be able to update the API key.
    """
    settings = JulesSettings.get_settings()
    settings.set_api_key("original-key")
    settings.save()

    response = admin_client.post(
        "/api/jules/settings/api-key/",
        data={"api_key": "admin-key"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK

    settings.refresh_from_db()
    assert settings.get_api_key() == "admin-key"
