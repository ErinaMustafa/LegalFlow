import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getCases } from "../../api/legalApi";
import { getClients } from "../../api/operationsApi";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} from "../../api/financeApi";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    expense_date: "",
    description: "",
    case_id: "",
    client_id: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadExpenses = async (params = {}) => {
    try {
      const data = await getExpenses(params);
      setExpenses(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load expenses");
    }
  };

  const loadCases = async () => {
    try {
      const data = await getCases();
      setCases(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load cases");
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

  const searchExpenses = async (value) => {
    if (!isNaN(value)) {
      const idResult = expenses.filter(
        (expense) => expense.id === Number(value)
      );

      if (idResult.length > 0) {
        setExpenses(idResult);
        setCurrentPage(1);
        return;
      }

      const amountResult = await getExpenses({ amount: Number(value) });

      if (amountResult.length > 0) {
        setExpenses(amountResult);
        setCurrentPage(1);
        return;
      }

      const caseResult = await getExpenses({ case_id: Number(value) });

      if (caseResult.length > 0) {
        setExpenses(caseResult);
        setCurrentPage(1);
        return;
      }

      const clientResult = await getExpenses({ client_id: Number(value) });

      if (clientResult.length > 0) {
        setExpenses(clientResult);
        setCurrentPage(1);
        return;
      }
    }

    const fields = ["title", "description", "expense_date"];

    for (const field of fields) {
      const data = await getExpenses({ [field]: value });

      if (data.length > 0) {
        setExpenses(data);
        setCurrentPage(1);
        return;
      }
    }

    setExpenses([]);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadExpenses();
    loadCases();
    loadClients();
  }, []);

  useEffect(() => {
    const value = search.trim();

    if (!value) {
      loadExpenses();
      return;
    }

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".expenses-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }

    const delaySearch = setTimeout(() => {
      searchExpenses(value);
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [search]);

  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = expenses.slice(startIndex, endIndex);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      title: "",
      amount: "",
      expense_date: "",
      description: "",
      case_id: "",
      client_id: ""
    });

    setEditingId(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const value = search.trim();

    if (!value) {
      loadExpenses();
      return;
    }

    await searchExpenses(value);

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".expenses-table-panel");

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
      title: form.title,
      amount: Number(form.amount),
      expense_date: form.expense_date || null,
      description: form.description || null,
      case_id: Number(form.case_id),
      client_id: Number(form.client_id)
    };

    try {
      setError("");

      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }

      resetForm();
      loadExpenses();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save expense");
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);

    setForm({
      title: expense.title || "",
      amount: expense.amount || "",
      expense_date: expense.expense_date
        ? expense.expense_date.slice(0, 16)
        : "",
      description: expense.description || "",
      case_id: expense.case_id || "",
      client_id: expense.client_id || ""
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

      await deleteExpense(deleteId);

      setDeleteId(null);
      loadExpenses();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete expense");
    }
  };

  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>FINANCE</span>
        <h1>Expenses</h1>
        <p>Manage expenses connected to cases and clients.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="dashboard-panel">
        <h2>{editingId ? "Update Expense" : "Create Expense"}</h2>

        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Expense title"
            value={form.title}
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

          <input
            name="expense_date"
            type="datetime-local"
            value={form.expense_date}
            onChange={handleChange}
          />

          <input
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />

          <select
            name="case_id"
            value={form.case_id}
            onChange={handleChange}
            required
          >
            <option value="">Select case</option>
            {cases.map((caseItem) => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.title}
              </option>
            ))}
          </select>

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
            {editingId ? "Update Expense" : "Create Expense"}
          </button>

          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="dashboard-panel expenses-table-panel">
        <h2>Expense List ({expenses.length})</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Amount</th>
              <th>Expense Date</th>
              <th>Description</th>
              <th>Case ID</th>
              <th>Client ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedExpenses.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.id}</td>
                <td>{expense.title}</td>
                <td>{expense.amount}</td>
                <td>
                  {expense.expense_date
                    ? new Date(expense.expense_date).toLocaleString()
                    : "-"}
                </td>
                <td>{expense.description || "-"}</td>
                <td>{expense.case_id}</td>
                <td>{expense.client_id}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(expense)}
                  >
                    Edit
                  </button>

                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(expense.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedExpenses.length === 0 && (
              <tr>
                <td colSpan="8">No expenses found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {expenses.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, expenses.length)} of {expenses.length} expenses
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
            <h2>Delete Expense</h2>

            <p>Are you sure you want to permanently delete this expense?</p>

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

export default Expenses;


