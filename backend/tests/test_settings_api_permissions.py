import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

@pytest.mark.django_db
def test_non_admin_cannot_update_api_key():
    client = APIClient()
    # Create a regular user (not staff/superuser)
    user = get_user_model().objects.create_user(username="testuser", password="password")
    client.force_authenticate(user=user)

    url = "/api/jules/settings/api-key/"
    data = {"api_key": "new_secret_key"}

    response = client.post(url, data, format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_admin_can_update_api_key():
    client = APIClient()
    # Create an admin user
    user = get_user_model().objects.create_user(username="adminuser", password="password", is_staff=True)
    client.force_authenticate(user=user)

    url = "/api/jules/settings/api-key/"
    data = {"api_key": "new_secret_key"}

    response = client.post(url, data, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "success"
