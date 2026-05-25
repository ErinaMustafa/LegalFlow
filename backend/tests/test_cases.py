from .conftest import client


def test_lawyer_can_get_cases(lawyer_headers):
    response = client.get(
        "/cases/",
        headers=lawyer_headers
    )

    assert response.status_code == 200


def test_finance_can_get_cases(finance_headers):
    response = client.get(
        "/cases/",
        headers=finance_headers
    )

    assert response.status_code == 200


def test_finance_cannot_create_case(finance_headers):
    response = client.post(
        "/cases/",
        headers=finance_headers,
        json={
            "title": "Finance Test Case",
            "description": "Finance should not create cases",
            "status": "Open",
            "client_id": 1,
            "practice_area_id": 1
        }
    )

    assert response.status_code == 403