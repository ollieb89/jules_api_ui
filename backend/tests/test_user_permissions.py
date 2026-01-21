import pytest
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User as AppUser
from django.contrib.auth.models import User as AuthUser

@pytest.mark.django_db
def test_user_cannot_edit_other_user():
    """
    SECURITY TEST:
    Verifies that a user CANNOT edit another user's profile.
    """
    # 1. Create two auth users (User A and User B)
    auth_user_a = AuthUser.objects.create_user(username="user_a", password="password", email="a@example.com")

    # 2. Create two app users (User A and User B)
    # Note: Linking relies on email
    app_user_a = AppUser.objects.create(name="User A", email="a@example.com")
    app_user_b = AppUser.objects.create(name="User B", email="b@example.com")

    # 3. Authenticate as User A
    client = APIClient()
    client.force_authenticate(user=auth_user_a)

    # 4. Try to edit User B
    payload = {"name": "Hacked by A"}
    response = client.patch(f"/api/users/{app_user_b.id}/", payload, format='json')

    # 5. Assert that the request was Forbidden
    assert response.status_code == status.HTTP_403_FORBIDDEN

    app_user_b.refresh_from_db()
    assert app_user_b.name == "User B"

@pytest.mark.django_db
def test_user_can_edit_own_profile():
    """
    FUNCTIONALITY TEST:
    Verifies that a user CAN edit their own profile.
    """
    # 1. Create user
    auth_user = AuthUser.objects.create_user(username="user_me", password="password", email="me@example.com")
    app_user = AppUser.objects.create(name="User Me", email="me@example.com")

    # 2. Authenticate
    client = APIClient()
    client.force_authenticate(user=auth_user)

    # 3. Edit own profile
    payload = {"name": "New Name"}
    response = client.patch(f"/api/users/{app_user.id}/", payload, format='json')

    # 4. Assert success
    assert response.status_code == status.HTTP_200_OK

    app_user.refresh_from_db()
    assert app_user.name == "New Name"

@pytest.mark.django_db
def test_admin_can_edit_any_profile():
    """
    FUNCTIONALITY TEST:
    Verifies that an admin can edit any profile.
    """
    # 1. Create admin
    admin_user = AuthUser.objects.create_superuser(username="admin", password="password", email="admin@example.com")
    app_user_b = AppUser.objects.create(name="User B", email="b@example.com")

    # 2. Authenticate
    client = APIClient()
    client.force_authenticate(user=admin_user)

    # 3. Edit other profile
    payload = {"name": "Admin Edit"}
    response = client.patch(f"/api/users/{app_user_b.id}/", payload, format='json')

    # 4. Assert success
    assert response.status_code == status.HTTP_200_OK

    app_user_b.refresh_from_db()
    assert app_user_b.name == "Admin Edit"
