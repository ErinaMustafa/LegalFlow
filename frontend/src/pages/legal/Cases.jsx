import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getCases,
  createCase,
  updateCase,
  deleteCase
} from "../../api/legalApi";
import { getClients } from "../../api/operationsApi";

function Cases() {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Open",
    client_id: "",
    practice_area_id: "",
    closed_at: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadCases = async (params = {}) => {
    try {
      const data = await getCases(params);
      setCases(data);
      setCurrentPage(1);
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

  const searchCases = async (value) => {
    if (!isNaN(value)) {
      const idResult = cases.filter(
        (caseItem) => caseItem.id === Number(value)
      );

      if (idResult.length > 0) {
        setCases(idResult);
        setCurrentPage(1);
        return;
      }

      const numericFields = ["client_id", "practice_area_id"];

      for (const field of numericFields) {
        const data = await getCases({ [field]: Number(value) });

        if (data.length > 0) {
          setCases(data);
          setCurrentPage(1);
          return;
        }
      }
    }

    const fields = ["title", "description", "status"];

    for (const field of fields) {
      const data = await getCases({ [field]: value });

      if (data.length > 0) {
        setCases(data);
        setCurrentPage(1);
        return;
      }
    }

    setCases([]);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadCases();
    loadClients();
  }, []);

  useEffect(() => {
    const value = search.trim();

    if (!value) {
      loadCases();
      return;
    }

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".cases-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }

    const delaySearch = setTimeout(() => {
      searchCases(value);
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [search]);

  const totalPages = Math.ceil(cases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCases = cases.slice(startIndex, endIndex);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      status: "Open",
      client_id: "",
      practice_area_id: "",
      closed_at: ""
    });

    setEditingId(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const value = search.trim();

    if (!value) {
      loadCases();
      return;
    }

    await searchCases(value);

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".cases-table-panel");

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
      description: form.description,
      status: form.status,
      client_id: Number(form.client_id),
      practice_area_id: form.practice_area_id
        ? Number(form.practice_area_id)
        : null,
      closed_at: form.closed_at || null
    };

    try {
      setError("");

      if (editingId) {
        await updateCase(editingId, payload);
      } else {
        await createCase(payload);
      }

      resetForm();
      loadCases();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save case");
    }
  };

  const handleEdit = (caseItem) => {
    setEditingId(caseItem.id);

    setForm({
      title: caseItem.title || "",
      description: caseItem.description || "",
      status: caseItem.status || "Open",
      client_id: caseItem.client_id || "",
      practice_area_id: caseItem.practice_area_id || "",
      closed_at: caseItem.closed_at ? caseItem.closed_at.slice(0, 16) : ""
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

      await deleteCase(deleteId);

      setDeleteId(null);
      loadCases();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete case");
    }
  };

  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>LEGAL</span>
        <h1>Cases</h1>
        <p>Manage legal cases linked to clients and practice areas.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="dashboard-panel">
        <h2>{editingId ? "Update Case" : "Create Case"}</h2>

        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Case title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <input
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            required
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
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

          <input
            name="practice_area_id"
            type="number"
            placeholder="Practice area ID optional"
            value={form.practice_area_id}
            onChange={handleChange}
          />

          <input
            name="closed_at"
            type="datetime-local"
            value={form.closed_at}
            onChange={handleChange}
          />

          <button type="submit">
            {editingId ? "Update Case" : "Create Case"}
          </button>

          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="dashboard-panel cases-table-panel">
        <h2>Case List ({cases.length})</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Client ID</th>
              <th>Practice Area ID</th>
              <th>Created</th>
              <th>Closed</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedCases.map((caseItem) => (
              <tr key={caseItem.id}>
                <td>{caseItem.id}</td>
                <td>{caseItem.title}</td>
                <td>{caseItem.description}</td>
                <td>{caseItem.status}</td>
                <td>{caseItem.client_id}</td>
                <td>{caseItem.practice_area_id || "-"}</td>
                <td>
                  {caseItem.created_at
                    ? new Date(caseItem.created_at).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  {caseItem.closed_at
                    ? new Date(caseItem.closed_at).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(caseItem)}
                  >
                    Edit
                  </button>

                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(caseItem.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedCases.length === 0 && (
              <tr>
                <td colSpan="9">No cases found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {cases.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} - {Math.min(endIndex, cases.length)} of{" "}
              {cases.length} cases
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
            <h2>Delete Case</h2>

            <p>Are you sure you want to permanently delete this case?</p>

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

export default Cases;