from .conftest import client


def test_finance_can_get_invoices(finance_headers):
    response = client.get(
        "/invoices/",
        headers=finance_headers
    )

    assert response.status_code == 200


def test_lawyer_cannot_create_invoice(lawyer_headers):
    response = client.post(
        "/invoices/",
        headers=lawyer_headers,
        json={
            "invoice_number": "TEST-INV-AUTO",
            "amount": 100,
            "status": "Unpaid",
            "client_id": 1
        }
    )

    assert response.status_code == 403