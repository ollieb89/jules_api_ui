import json

import pytest


@pytest.mark.django_db
def test_create_user(client):
    """Test creating a user."""
    response = client.post(
        "/api/users/",
        data=json.dumps({"name": "Test User", "email": "test@example.com"}),
        content_type="application/json",
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test User"
    assert data["email"] == "test@example.com"
    assert "id" in data


@pytest.mark.django_db
def test_read_users(client):
    """Test reading all users."""
    # Create a user first
    client.post(
        "/api/users/",
        data=json.dumps({"name": "Alpha", "email": "alpha@example.com"}),
        content_type="application/json",
    )

    response = client.get("/api/users/")
    assert response.status_code == 200
    data = response.json()
    # DRF returns paginated results, so check for 'results' key
    assert "results" in data or isinstance(data, list)
    if "results" in data:
        assert len(data["results"]) >= 1
    else:
        assert len(data) >= 1


@pytest.mark.django_db
def test_get_user_by_id(client):
    """Test getting a user by ID."""
    create_res = client.post(
        "/api/users/",
        data=json.dumps({"name": "Beta", "email": "beta@example.com"}),
        content_type="application/json",
    )
    user_id = create_res.json()["id"]

    response = client.get(f"/api/users/{user_id}/")
    assert response.status_code == 200
    assert response.json()["id"] == user_id
