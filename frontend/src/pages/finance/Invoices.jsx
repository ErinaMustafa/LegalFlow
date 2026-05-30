import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getClients } from "../../api/operationsApi";
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from "../../api/financeApi";

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);

  const [form, setForm] = useState({
    invoice_number: "",
    amount: "",
    status: "Unpaid",
    due_date: "",
    client_id: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadInvoices = async (params = {}) => {
    try {
      const data = await getInvoices(params);
      setInvoices(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load invoices");
    }
  };

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load clients");
    }
  };

  const searchInvoices = async (value) => {
    if (!isNaN(value)) {
      const idResult = invoices.filter(
        (invoice) => invoice.id === Number(value)
      );

      if (idResult.length > 0) {
        setInvoices(idResult);
        setCurrentPage(1);
        return;
      }

      const clientResult = await getInvoices({ client_id: Number(value) });

      if (clientResult.length > 0) {
        setInvoices(clientResult);
        setCurrentPage(1);
        return;
      }

      const amountResult = await getInvoices({ amount: Number(value) });

      if (amountResult.length > 0) {
        setInvoices(amountResult);
        setCurrentPage(1);
        return;
      }
    }

    const fields = ["invoice_number", "status", "issued_date", "due_date"];

    for (const field of fields) {
      const data = await getInvoices({ [field]: value });

      if (data.length > 0) {
        setInvoices(data);
        setCurrentPage(1);
        return;
      }
    }

    setInvoices([]);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadInvoices();
    loadClients();
  }, []);

  useEffect(() => {
    const value = search.trim();

    if (!value) {
      loadInvoices();
      return;
    }

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".invoices-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }

    const delaySearch = setTimeout(() => {
      searchInvoices(value);
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [search]);

  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = invoices.slice(startIndex, endIndex);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      invoice_number: "",
      amount: "",
      status: "Unpaid",
      due_date: "",
      client_id: ""
    });

    setEditingId(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const value = search.trim();

    if (!value) {
      loadInvoices();
      return;
    }

    await searchInvoices(value);

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".invoices-table-panel");

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
      invoice_number: form.invoice_number,
      amount: Number(form.amount),
      status: form.status,
      due_date: form.due_date || null,
      client_id: Number(form.client_id)
    };

    try {
      setError("");

      if (editingId) {
        await updateInvoice(editingId, payload);
      } else {
        await createInvoice(payload);
      }

      resetForm();
      loadInvoices();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save invoice");
    }
  };

  const handleEdit = (invoice) => {
    setEditingId(invoice.id);

    setForm({
      invoice_number: invoice.invoice_number || "",
      amount: invoice.amount || "",
      status: invoice.status || "Unpaid",
      due_date: invoice.due_date ? invoice.due_date.slice(0, 16) : "",
      client_id: invoice.client_id || ""
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

      await deleteInvoice(deleteId);

      setDeleteId(null);
      loadInvoices();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete invoice");
    }
  };

  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>FINANCE</span>
        <h1>Invoices</h1>
        <p>Manage invoices connected to clients.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="dashboard-panel">
        <h2>{editingId ? "Update Invoice" : "Create Invoice"}</h2>

        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="invoice_number"
            placeholder="Invoice number"
            value={form.invoice_number}
            onChange={handleChange}
            required
          />

          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            required
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>

          <input
            name="due_date"
            type="datetime-local"
            value={form.due_date}
            onChange={handleChange}
          />

          <select
            name="client_id"
            value={form.client_id}
            onChange={handleChange}
            required
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>

          <button type="submit">
            {editingId ? "Update Invoice" : "Create Invoice"}
          </button>

          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="dashboard-panel invoices-table-panel">
        <h2>Invoice List ({invoices.length})</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Invoice Number</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Issued Date</th>
              <th>Due Date</th>
              <th>Client ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.id}</td>
                <td>{invoice.invoice_number}</td>
                <td>{invoice.amount}</td>
                <td>{invoice.status}</td>
                <td>
                  {invoice.issued_date
                    ? new Date(invoice.issued_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  {invoice.due_date
                    ? new Date(invoice.due_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>{invoice.client_id}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(invoice)}
                  >
                    Edit
                  </button>

                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(invoice.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedInvoices.length === 0 && (
              <tr>
                <td colSpan="8">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {invoices.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, invoices.length)} of {invoices.length} invoices
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
            <h2>Delete Invoice</h2>

            <p>Are you sure you want to permanently delete this invoice?</p>

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

export default Invoices;

