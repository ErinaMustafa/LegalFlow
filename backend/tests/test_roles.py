from .conftest import client


def test_admin_can_get_roles(admin_headers):
    response = client.get(
        "/roles/",
        headers=admin_headers
    )

    assert response.status_code == 200


def test_lawyer_cannot_get_roles(lawyer_headers):
    response = client.get(
        "/roles/",
        headers=lawyer_headers
    )

    assert response.status_code == 403