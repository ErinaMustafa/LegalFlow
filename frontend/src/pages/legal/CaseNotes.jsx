import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getCases } from "../../api/legalApi";
import {
  getCaseNotes,
  createCaseNote,
  updateCaseNote,
  deleteCaseNote
} from "../../api/legalApi";

function CaseNotes() {
  const [caseNotes, setCaseNotes] = useState([]);
  const [cases, setCases] = useState([]);

  const [form, setForm] = useState({
    note: "",
    created_at: "",
    case_id: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadCaseNotes = async (params = {}) => {
    try {
      const data = await getCaseNotes(params);
      setCaseNotes(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load case notes");
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

  const searchCaseNotes = async (value) => {
    if (!isNaN(value)) {
      const idResult = caseNotes.filter(
        (caseNote) => caseNote.id === Number(value)
      );

      if (idResult.length > 0) {
        setCaseNotes(idResult);
        setCurrentPage(1);
        return;
      }

      const caseResult = await getCaseNotes({ case_id: Number(value) });

      if (caseResult.length > 0) {
        setCaseNotes(caseResult);
        setCurrentPage(1);
        return;
      }
    }

    const fields = ["note", "created_at"];

    for (const field of fields) {
      const data = await getCaseNotes({ [field]: value });

      if (data.length > 0) {
        setCaseNotes(data);
        setCurrentPage(1);
        return;
      }
    }

    setCaseNotes([]);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadCaseNotes();
    loadCases();
  }, []);

  useEffect(() => {
    const value = search.trim();

    if (!value) {
      loadCaseNotes();
      return;
    }

    const delaySearch = setTimeout(() => {
      searchCaseNotes(value);
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [search]);

  const totalPages = Math.ceil(caseNotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCaseNotes = caseNotes.slice(startIndex, endIndex);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      note: "",
      created_at: "",
      case_id: ""
    });

    setEditingId(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const value = search.trim();

    if (!value) {
      loadCaseNotes();
      return;
    }

    await searchCaseNotes(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      note: form.note,
      created_at: form.created_at || null,
      case_id: Number(form.case_id)
    };

    try {
      setError("");

      if (editingId) {
        await updateCaseNote(editingId, payload);
      } else {
        await createCaseNote(payload);
      }

      resetForm();
      loadCaseNotes();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save case note");
    }
  };

  const handleEdit = (caseNote) => {
    setEditingId(caseNote.id);

    setForm({
      note: caseNote.note || "",
      created_at: caseNote.created_at ? caseNote.created_at.slice(0, 16) : "",
      case_id: caseNote.case_id || ""
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

      await deleteCaseNote(deleteId);

      setDeleteId(null);
      loadCaseNotes();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete case note");
    }
  };

  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>LEGAL MANAGEMENT</span>
        <h1>Case Notes</h1>
        <p>Manage notes connected to legal cases.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="dashboard-panel">
        <h2>{editingId ? "Update Case Note" : "Create Case Note"}</h2>

        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="note"
            placeholder="Case note"
            value={form.note}
            onChange={handleChange}
            required
          />

          <input
            name="created_at"
            type="datetime-local"
            value={form.created_at}
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

          <button type="submit">
            {editingId ? "Update Case Note" : "Create Case Note"}
          </button>

          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="dashboard-panel case-notes-table-panel">
        <h2>Case Note List ({caseNotes.length})</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Note</th>
              <th>Created At</th>
              <th>Case ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedCaseNotes.map((caseNote) => (
              <tr key={caseNote.id}>
                <td>{caseNote.id}</td>
                <td>{caseNote.note}</td>
                <td>
                  {caseNote.created_at
                    ? new Date(caseNote.created_at).toLocaleString()
                    : "-"}
                </td>
                <td>{caseNote.case_id}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(caseNote)}
                  >
                    Edit
                  </button>

                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(caseNote.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedCaseNotes.length === 0 && (
              <tr>
                <td colSpan="5">No case notes found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {caseNotes.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, caseNotes.length)} of{" "}
              {caseNotes.length} case notes
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
            <h2>Delete Case Note</h2>

            <p>Are you sure you want to permanently delete this case note?</p>

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

export default CaseNotes;
