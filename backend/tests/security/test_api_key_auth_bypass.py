import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from jules.models import JulesSettings


@pytest.mark.django_db
def test_non_admin_cannot_update_api_key():
    """
    Verify that a regular (non-admin) user CANNOT update the API key.
    """
    # Create a regular user
    user = User.objects.create_user(username="regular", password="password")

    # Authenticate
    client = APIClient()
    client.force_authenticate(user=user)

    # URL for update_api_key action in SettingsViewSet
    url = "/api/jules/settings/api-key/"

    # Capture old key to ensure it didn't change
    settings = JulesSettings.get_settings()
    old_key = settings.get_api_key()

    new_key = "sk_test_hacked"
    response = client.post(url, {"api_key": new_key}, format="json")

    # Expect 403 Forbidden
    assert response.status_code == 403

    # Verify key was NOT changed
    settings.refresh_from_db()
    assert settings.get_api_key() == old_key


@pytest.mark.django_db
def test_admin_can_update_api_key():
    """Verify admin can update API key."""
    admin = User.objects.create_superuser(
        username="admin", password="password", email="admin@example.com"
    )

    client = APIClient()
    client.force_authenticate(user=admin)

    url = "/api/jules/settings/api-key/"
    new_key = "sk_test_admin_key"

    response = client.post(url, {"api_key": new_key}, format="json")
    assert response.status_code == 200

    settings = JulesSettings.get_settings()
    assert settings.get_api_key() == new_key
