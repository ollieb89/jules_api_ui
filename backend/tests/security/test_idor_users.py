import pytest
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User as AppUser
from django.contrib.auth.models import User as AuthUser


@pytest.mark.django_db
def test_user_cannot_view_other_user_profile():
    """
    SECURITY TEST:
    Verifies that a user CANNOT view another user's profile details.
    """
    # 1. Create two auth users (User A and User B)
    auth_user_a = AuthUser.objects.create_user(
        username="user_a", password="password", email="a@example.com"
    )

    # 2. Create two app users
    AppUser.objects.create(name="User A", email="a@example.com")
    app_user_b = AppUser.objects.create(name="User B", email="b@example.com")

    # 3. Authenticate as User A
    client = APIClient()
    client.force_authenticate(user=auth_user_a)

    # 4. Try to view User B's profile
    response = client.get(f"/api/users/{app_user_b.id}/")

    # 5. Assert that the request was Forbidden or Not Found (if filtered)
    if response.status_code == 200:
        pytest.fail(
            f"VULNERABILITY CONFIRMED: User A could view User B's profile: {response.data}"
        )

    assert response.status_code in [
        status.HTTP_403_FORBIDDEN,
        status.HTTP_404_NOT_FOUND,
    ]


@pytest.mark.django_db
def test_user_cannot_list_all_users():
    """
    SECURITY TEST:
    Verifies that a user CANNOT list all users.
    """
    # 1. Create two auth users
    auth_user_a = AuthUser.objects.create_user(
        username="user_a", password="password", email="a@example.com"
    )

    app_user_a = AppUser.objects.create(name="User A", email="a@example.com")
    app_user_b = AppUser.objects.create(name="User B", email="b@example.com")

    # 2. Authenticate as User A
    client = APIClient()
    client.force_authenticate(user=auth_user_a)

    # 3. Try to list all users
    response = client.get("/api/users/")

    # 4. Assert that the request was filtered
    if response.status_code == 200:
        results = response.data.get("results", response.data)
        ids = [u["id"] for u in results]
        if app_user_b.id in ids:
            pytest.fail(
                f"VULNERABILITY CONFIRMED: User A could see User B in list: {results}"
            )
        # Verify User A can see themselves
        assert app_user_a.id in ids, "User A should see their own profile"
    else:
        assert response.status_code == status.HTTP_403_FORBIDDEN
