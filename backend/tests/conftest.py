import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


ADMIN_EMAIL = "admin@legalflow.com"
ADMIN_PASSWORD = "admin123"

LAWYER_EMAIL = "lawyer2@email.com"
LAWYER_PASSWORD = "123456"

FINANCE_EMAIL = "finance2@email.com"
FINANCE_PASSWORD = "123456"

ASSISTANT_EMAIL = "assistant2@email.com"
ASSISTANT_PASSWORD = "123456"

MANAGER_EMAIL = "manager2@email.com"
MANAGER_PASSWORD = "123456"


def login(email, password):
    response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    return response.json()["access_token"]


@pytest.fixture
def admin_headers():
    token = login(
        ADMIN_EMAIL,
        ADMIN_PASSWORD
    )

    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture
def lawyer_headers():
    token = login(
        LAWYER_EMAIL,
        LAWYER_PASSWORD
    )

    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture
def finance_headers():
    token = login(
        FINANCE_EMAIL,
        FINANCE_PASSWORD
    )

    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture
def assistant_headers():
    token = login(
        ASSISTANT_EMAIL,
        ASSISTANT_PASSWORD
    )

    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture
def manager_headers():
    token = login(
        MANAGER_EMAIL,
        MANAGER_PASSWORD
    )

    return {
        "Authorization": f"Bearer {token}"
    }