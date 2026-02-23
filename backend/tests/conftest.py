import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

@pytest.fixture
def admin_client(db):
    """Fixture to provide an APIClient authenticated as a staff/admin user."""
    user_model = get_user_model()
    admin_user = user_model.objects.create_user(
        username="admin_tester",
        password="password",
        is_staff=True,
        is_superuser=True
    )
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client
