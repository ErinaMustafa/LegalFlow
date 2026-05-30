import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getInvoices,
  getPayments,
  createPayment,
  updatePayment,
  deletePayment
} from "../../api/financeApi";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [form, setForm] = useState({
    amount: "",
    payment_method: "",
    status: "Completed",
    invoice_id: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadPayments = async (params = {}) => {
    try {
      const data = await getPayments(params);
      setPayments(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load payments");
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load invoices");
    }
  };

  const searchPayments = async (value) => {
    if (!isNaN(value)) {
      const idResult = payments.filter(
        (payment) => payment.id === Number(value)
      );

      if (idResult.length > 0) {
        setPayments(idResult);
        setCurrentPage(1);
        return;
      }

      const invoiceResult = await getPayments({ invoice_id: Number(value) });

      if (invoiceResult.length > 0) {
        setPayments(invoiceResult);
        setCurrentPage(1);
        return;
      }

      const amountResult = await getPayments({ amount: Number(value) });

      if (amountResult.length > 0) {
        setPayments(amountResult);
        setCurrentPage(1);
        return;
      }
    }

    const fields = ["payment_method", "status", "payment_date"];

    for (const field of fields) {
      const data = await getPayments({ [field]: value });

      if (data.length > 0) {
        setPayments(data);
        setCurrentPage(1);
        return;
      }
    }

    setPayments([]);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadPayments();
    loadInvoices();
  }, []);

  useEffect(() => {
    const value = search.trim();

    if (!value) {
      loadPayments();
      return;
    }

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".payments-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }

    const delaySearch = setTimeout(() => {
      searchPayments(value);
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [search]);

  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = payments.slice(startIndex, endIndex);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      amount: "",
      payment_method: "",
      status: "Completed",
      invoice_id: ""
    });

    setEditingId(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const value = search.trim();

    if (!value) {
      loadPayments();
      return;
    }

    await searchPayments(value);

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".payments-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "smooth"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      amount: Number(form.amount),
      payment_method: form.payment_method || null,
      status: form.status,
      invoice_id: Number(form.invoice_id)
    };

    try {
      setError("");

      if (editingId) {
        await updatePayment(editingId, payload);
      } else {
        await createPayment(payload);
      }

      resetForm();
      loadPayments();
      loadInvoices();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save payment");
    }
  };

  const handleEdit = (payment) => {
    setEditingId(payment.id);

    setForm({
      amount: payment.amount || "",
      payment_method: payment.payment_method || "",
      status: payment.status || "Completed",
      invoice_id: payment.invoice_id || ""
    });

    const pageContent = document.querySelector(".page-content");

    if (pageContent) {
      pageContent.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  };

  const confirmDelete = async () => {
    try {
      setError("");

      await deletePayment(deleteId);

      setDeleteId(null);
      loadPayments();
      loadInvoices();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete payment");
    }
  };

  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>FINANCE</span>
        <h1>Payments</h1>
        <p>Manage payments connected to invoices.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="dashboard-panel">
        <h2>{editingId ? "Update Payment" : "Create Payment"}</h2>

        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            required
          />

          <input
            name="payment_method"
            placeholder="Payment method"
            value={form.payment_method}
            onChange={handleChange}
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>

          <select
            name="invoice_id"
            value={form.invoice_id}
            onChange={handleChange}
            required
          >
            <option value="">Select invoice</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.invoice_number} - {invoice.amount}
              </option>
            ))}
          </select>

          <button type="submit">
            {editingId ? "Update Payment" : "Create Payment"}
          </button>

          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="dashboard-panel payments-table-panel">
        <h2>Payment List ({payments.length})</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Payment Date</th>
              <th>Invoice ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedPayments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.id}</td>
                <td>{payment.amount}</td>
                <td>{payment.payment_method || "-"}</td>
                <td>{payment.status}</td>
                <td>
                  {payment.payment_date
                    ? new Date(payment.payment_date).toLocaleString()
                    : "-"}
                </td>
                <td>{payment.invoice_id}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(payment)}
                  >
                    Edit
                  </button>

                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(payment.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedPayments.length === 0 && (
              <tr>
                <td colSpan="7">No payments found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {payments.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, payments.length)} of {payments.length} payments
            </span>

            <div className="pagination-buttons">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteId && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h2>Delete Payment</h2>

            <p>Are you sure you want to permanently delete this payment?</p>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>

              <button className="danger-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Payments;

