import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User as AuthUser
from users.models import User as AppUser

@pytest.mark.django_db
def test_user_cannot_update_other_user_profile():
    """
    Test verifying the IDOR protection.
    User A (attacker) tries to update User B's (victim) profile.
    This should fail with 403 Forbidden.
    """
    # Create Attacker
    attacker_auth = AuthUser.objects.create_user(username="attacker", email="attacker@example.com", password="password")
    attacker_profile = AppUser.objects.create(name="Attacker", email="attacker@example.com")

    # Create Victim
    victim_auth = AuthUser.objects.create_user(username="victim", email="victim@example.com", password="password")
    victim_profile = AppUser.objects.create(name="Victim", email="victim@example.com")

    client = APIClient()
    client.force_authenticate(user=attacker_auth)

    # Attacker tries to change Victim's name
    url = f"/api/users/{victim_profile.id}/"
    data = {"name": "Hacked", "email": "victim@example.com"}

    response = client.put(url, data, format="json")

    # VERIFICATION: Should return 403 Forbidden
    assert response.status_code == status.HTTP_403_FORBIDDEN

    victim_profile.refresh_from_db()
    assert victim_profile.name == "Victim"

@pytest.mark.django_db
def test_user_can_update_own_profile():
    """
    Test that a user can still update their own profile.
    """
    user_auth = AuthUser.objects.create_user(username="user", email="user@example.com", password="password")
    user_profile = AppUser.objects.create(name="User", email="user@example.com")

    client = APIClient()
    client.force_authenticate(user=user_auth)

    url = f"/api/users/{user_profile.id}/"
    data = {"name": "New Name", "email": "user@example.com"}

    response = client.put(url, data, format="json")

    assert response.status_code == status.HTTP_200_OK

    user_profile.refresh_from_db()
    assert user_profile.name == "New Name"
