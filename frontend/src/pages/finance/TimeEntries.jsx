import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getCases } from "../../api/legalApi";
import { getTasks } from "../../api/operationsApi";
import {
  getTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry
} from "../../api/financeApi";

function TimeEntries() {
  const [timeEntries, setTimeEntries] = useState([]);
  const [cases, setCases] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [form, setForm] = useState({
    hours: "",
    description: "",
    entry_date: "",
    user_id: "",
    case_id: "",
    task_id: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadTimeEntries = async (params = {}) => {
    try {
      const data = await getTimeEntries(params);
      setTimeEntries(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load time entries");
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

  const loadTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load tasks");
    }
  };

  const searchTimeEntries = async (value) => {
    if (!isNaN(value)) {
      const idResult = timeEntries.filter(
        (entry) => entry.id === Number(value)
      );

      if (idResult.length > 0) {
        setTimeEntries(idResult);
        setCurrentPage(1);
        return;
      }

      const hoursResult = await getTimeEntries({ hours: Number(value) });

      if (hoursResult.length > 0) {
        setTimeEntries(hoursResult);
        setCurrentPage(1);
        return;
      }

      const userResult = await getTimeEntries({ user_id: Number(value) });

      if (userResult.length > 0) {
        setTimeEntries(userResult);
        setCurrentPage(1);
        return;
      }

      const caseResult = await getTimeEntries({ case_id: Number(value) });

      if (caseResult.length > 0) {
        setTimeEntries(caseResult);
        setCurrentPage(1);
        return;
      }

      const taskResult = await getTimeEntries({ task_id: Number(value) });

      if (taskResult.length > 0) {
        setTimeEntries(taskResult);
        setCurrentPage(1);
        return;
      }
    }

    const fields = ["description", "entry_date"];

    for (const field of fields) {
      const data = await getTimeEntries({ [field]: value });

      if (data.length > 0) {
        setTimeEntries(data);
        setCurrentPage(1);
        return;
      }
    }

    setTimeEntries([]);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadTimeEntries();
    loadCases();
    loadTasks();
  }, []);

  useEffect(() => {
    const value = search.trim();

    if (!value) {
      loadTimeEntries();
      return;
    }

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".time-entries-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }

    const delaySearch = setTimeout(() => {
      searchTimeEntries(value);
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [search]);

  const totalPages = Math.ceil(timeEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTimeEntries = timeEntries.slice(startIndex, endIndex);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      hours: "",
      description: "",
      entry_date: "",
      user_id: "",
      case_id: "",
      task_id: ""
    });

    setEditingId(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const value = search.trim();

    if (!value) {
      loadTimeEntries();
      return;
    }

    await searchTimeEntries(value);

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".time-entries-table-panel");

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
      hours: Number(form.hours),
      description: form.description || null,
      entry_date: form.entry_date || null,
      user_id: Number(form.user_id),
      case_id: Number(form.case_id),
      task_id: form.task_id ? Number(form.task_id) : null
    };

    try {
      setError("");

      if (editingId) {
        await updateTimeEntry(editingId, payload);
      } else {
        await createTimeEntry(payload);
      }

      resetForm();
      loadTimeEntries();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save time entry");
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);

    setForm({
      hours: entry.hours || "",
      description: entry.description || "",
      entry_date: entry.entry_date ? entry.entry_date.slice(0, 16) : "",
      user_id: entry.user_id || "",
      case_id: entry.case_id || "",
      task_id: entry.task_id || ""
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

      await deleteTimeEntry(deleteId);

      setDeleteId(null);
      loadTimeEntries();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete time entry");
    }
  };

  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>FINANCE</span>
        <h1>Time Entries</h1>
        <p>Manage billable time entries connected to cases and tasks.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="dashboard-panel">
        <h2>{editingId ? "Update Time Entry" : "Create Time Entry"}</h2>

        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="hours"
            type="number"
            step="0.25"
            placeholder="Hours"
            value={form.hours}
            onChange={handleChange}
            required
          />

          <input
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />

          <input
            name="entry_date"
            type="datetime-local"
            value={form.entry_date}
            onChange={handleChange}
          />

          <input
            name="user_id"
            type="number"
            placeholder="User ID"
            value={form.user_id}
            onChange={handleChange}
            required
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
            name="task_id"
            value={form.task_id}
            onChange={handleChange}
          >
            <option value="">No task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>

          <button type="submit">
            {editingId ? "Update Time Entry" : "Create Time Entry"}
          </button>

          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="dashboard-panel time-entries-table-panel">
        <h2>Time Entry List ({timeEntries.length})</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Hours</th>
              <th>Description</th>
              <th>Entry Date</th>
              <th>User ID</th>
              <th>Case ID</th>
              <th>Task ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedTimeEntries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                <td>{entry.hours}</td>
                <td>{entry.description || "-"}</td>
                <td>
                  {entry.entry_date
                    ? new Date(entry.entry_date).toLocaleString()
                    : "-"}
                </td>
                <td>{entry.user_id}</td>
                <td>{entry.case_id}</td>
                <td>{entry.task_id || "-"}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(entry)}
                  >
                    Edit
                  </button>

                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(entry.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedTimeEntries.length === 0 && (
              <tr>
                <td colSpan="8">No time entries found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {timeEntries.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, timeEntries.length)} of{" "}
              {timeEntries.length} time entries
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
            <h2>Delete Time Entry</h2>

            <p>Are you sure you want to permanently delete this time entry?</p>

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

export default TimeEntries;

