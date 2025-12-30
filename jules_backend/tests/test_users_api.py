import pytest


@pytest.mark.asyncio
async def test_create_user(async_client):
    payload = {
        "email": "Test@Example.com",
        "password": "password123",
        "role": "user",
        "is_active": True,
    }

    response = await async_client.post("/api/v1/users/", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["email"] == "test@example.com"
    assert body["data"]["role"] == "user"
    assert body["data"]["is_active"] is True
    assert "hashed_password" not in body["data"]
    assert body["meta"]["version"] == "v1"


@pytest.mark.asyncio
async def test_create_user_duplicate_email(async_client):
    payload = {
        "email": "dup@example.com",
        "password": "password123",
        "role": "user",
        "is_active": True,
    }

    await async_client.post("/api/v1/users/", json=payload)
    response = await async_client.post("/api/v1/users/", json=payload)

    assert response.status_code == 409
    body = response.json()
    assert body["success"] is False
    assert body["error"]["status"] == 409


@pytest.mark.asyncio
async def test_create_user_validation(async_client):
    payload = {
        "email": "not-an-email",
        "password": "short",
        "role": "invalid",
        "is_active": True,
    }

    response = await async_client.post("/api/v1/users/", json=payload)

    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert body["error"]["status"] == 422


@pytest.mark.asyncio
async def test_get_user_by_id(async_client):
    payload = {
        "email": "fetch@example.com",
        "password": "password123",
        "role": "viewer",
        "is_active": True,
    }

    create_response = await async_client.post("/api/v1/users/", json=payload)
    user_id = create_response.json()["data"]["id"]

    response = await async_client.get(f"/api/v1/users/{user_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["id"] == user_id
    assert body["data"]["email"] == "fetch@example.com"


@pytest.mark.asyncio
async def test_get_user_not_found(async_client):
    response = await async_client.get("/api/v1/users/9999")

    assert response.status_code == 404
    body = response.json()
    assert body["success"] is False
    assert body["error"]["status"] == 404


@pytest.mark.asyncio
async def test_list_users_pagination(async_client):
    for index in range(3):
        await async_client.post(
            "/api/v1/users/",
            json={
                "email": f"list{index}@example.com",
                "password": "password123",
                "role": "user",
                "is_active": True,
            },
        )

    response = await async_client.get("/api/v1/users/?page=1&per_page=2")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    pagination = body["meta"]["pagination"]
    assert pagination["page"] == 1
    assert pagination["per_page"] == 2
    assert pagination["total"] >= 3
    assert pagination["total_pages"] >= 2


@pytest.mark.asyncio
async def test_update_user(async_client):
    create_response = await async_client.post(
        "/api/v1/users/",
        json={
            "email": "update@example.com",
            "password": "password123",
            "role": "user",
            "is_active": True,
        },
    )
    user_id = create_response.json()["data"]["id"]

    response = await async_client.patch(
        f"/api/v1/users/{user_id}",
        json={"role": "admin", "is_active": False},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["role"] == "admin"
    assert body["data"]["is_active"] is False


@pytest.mark.asyncio
async def test_delete_user(async_client):
    create_response = await async_client.post(
        "/api/v1/users/",
        json={
            "email": "delete@example.com",
            "password": "password123",
            "role": "user",
            "is_active": True,
        },
    )
    user_id = create_response.json()["data"]["id"]

    response = await async_client.delete(f"/api/v1/users/{user_id}")

    assert response.status_code == 204

    get_response = await async_client.get(f"/api/v1/users/{user_id}")
    assert get_response.status_code == 404
