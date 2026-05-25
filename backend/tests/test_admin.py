from .conftest import client


def test_admin_can_access_create_user(admin_headers):
    response = client.post(
        "/admin/create-user",
        headers=admin_headers,
        json={
            "username": "test_lawyer_auto",
            "email": "test_lawyer_auto@email.com",
            "password": "123456",
            "role_id": 2
        }
    )

    assert response.status_code in [200, 400]


def test_lawyer_cannot_create_user(lawyer_headers):
    response = client.post(
        "/admin/create-user",
        headers=lawyer_headers,
        json={
            "username": "bad_user",
            "email": "bad_user@email.com",
            "password": "123456",
            "role_id": 2
        }
    )

    assert response.status_code == 403