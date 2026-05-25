from .conftest import client


def test_register_is_disabled():
    response = client.post("/auth/register")

    assert response.status_code == 403
    assert response.json()["detail"] == "Public registration is disabled. Users must be created by Admin."


def test_admin_login_success():
    response = client.post(
        "/auth/login",
        json={
            "email": "admin@legalflow.com",
            "password": "admin123"
        }
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["role"] == "Admin"