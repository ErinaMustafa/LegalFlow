import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import {
  getAIAnalyses,
  analyzeText,
  updateAIAnalysis,
  deleteAIAnalysis
} from "../../api/aiApi";

function AIAnalyses() {
  const [analyses, setAnalyses] = useState([]);

  const [form, setForm] = useState({
    prompt: "",
    analysis_type: "text_analysis",
    case_id: "",
    document_id: ""
  });

  const [editForm, setEditForm] = useState({
    prompt: "",
    result: "",
    analysis_type: "",
    created_at: "",
    user_id: "",
    case_id: "",
    document_id: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadAnalyses = async () => {
    try {
      const data = await getAIAnalyses();
      setAnalyses(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load AI analyses");
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredAnalyses = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return analyses;

    return analyses.filter((item) => {
      return (
        String(item.id).includes(value) ||
        item.prompt?.toLowerCase().includes(value) ||
        item.result?.toLowerCase().includes(value) ||
        item.analysis_type?.toLowerCase().includes(value) ||
        String(item.user_id || "").includes(value) ||
        String(item.case_id || "").includes(value) ||
        String(item.document_id || "").includes(value)
      );
    });
  }, [analyses, search]);

  const totalPages = Math.ceil(filteredAnalyses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAnalyses = filteredAnalyses.slice(startIndex, endIndex);

  const handleSearch = (e) => {
    e.preventDefault();

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".ai-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "smooth"
      });
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      prompt: "",
      analysis_type: "text_analysis",
      case_id: "",
      document_id: ""
    });
  };

  const resetEditForm = () => {
    setEditingId(null);

    setEditForm({
      prompt: "",
      result: "",
      analysis_type: "",
      created_at: "",
      user_id: "",
      case_id: "",
      document_id: ""
    });
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    const payload = {
      prompt: form.prompt,
      analysis_type: form.analysis_type || "text_analysis",
      case_id: form.case_id ? Number(form.case_id) : null,
      document_id: form.document_id ? Number(form.document_id) : null
    };

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      await analyzeText(payload);

      setSuccess("AI analysis created successfully");

      resetForm();
      loadAnalyses();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to analyze text");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (analysis) => {
    setEditingId(analysis.id);

    setEditForm({
      prompt: analysis.prompt || "",
      result: analysis.result || "",
      analysis_type: analysis.analysis_type || "",
      created_at: analysis.created_at ? analysis.created_at.slice(0, 16) : "",
      user_id: analysis.user_id || "",
      case_id: analysis.case_id || "",
      document_id: analysis.document_id || ""
    });

    const pageContent = document.querySelector(".page-content");

    if (pageContent) {
      pageContent.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const payload = {
      prompt: editForm.prompt,
      result: editForm.result,
      analysis_type: editForm.analysis_type || null,
      created_at: editForm.created_at || null,
      user_id: Number(editForm.user_id),
      case_id: editForm.case_id ? Number(editForm.case_id) : null,
      document_id: editForm.document_id ? Number(editForm.document_id) : null
    };

    try {
      setError("");
      setSuccess("");

      await updateAIAnalysis(editingId, payload);

      setSuccess("AI analysis updated successfully");

      resetEditForm();
      loadAnalyses();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update AI analysis");
    }
  };

  const confirmDelete = async () => {
    try {
      setError("");
      setSuccess("");

      await deleteAIAnalysis(deleteId);

      setDeleteId(null);
      setSuccess("AI analysis deleted successfully");
      loadAnalyses();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete AI analysis");
    }
  };

  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>AI</span>
        <h1>AI Analyses</h1>
        <p>Create, review, update, and delete AI legal analyses.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      {success && <div className="success-box">{success}</div>}

      {!editingId && (
        <div className="dashboard-panel">
          <h2>Create AI Analysis</h2>

          <form className="module-form" onSubmit={handleAnalyze}>
            <input
              name="prompt"
              placeholder="Prompt"
              value={form.prompt}
              onChange={handleChange}
              required
            />

            <input
              name="analysis_type"
              placeholder="Analysis type"
              value={form.analysis_type}
              onChange={handleChange}
            />

            <input
              name="case_id"
              type="number"
              placeholder="Case ID optional"
              value={form.case_id}
              onChange={handleChange}
            />

            <input
              name="document_id"
              type="number"
              placeholder="Document ID optional"
              value={form.document_id}
              onChange={handleChange}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Text"}
            </button>
          </form>
        </div>
      )}

      {editingId && (
        <div className="dashboard-panel">
          <h2>Update AI Analysis</h2>

          <form className="module-form" onSubmit={handleUpdate}>
            <input
              name="prompt"
              placeholder="Prompt"
              value={editForm.prompt}
              onChange={handleEditChange}
              required
            />

            <input
              name="result"
              placeholder="Result"
              value={editForm.result}
              onChange={handleEditChange}
              required
            />

            <input
              name="analysis_type"
              placeholder="Analysis type"
              value={editForm.analysis_type}
              onChange={handleEditChange}
            />

            <input
              name="created_at"
              type="datetime-local"
              value={editForm.created_at}
              onChange={handleEditChange}
            />

            <input
              name="user_id"
              type="number"
              placeholder="User ID"
              value={editForm.user_id}
              onChange={handleEditChange}
              required
            />

            <input
              name="case_id"
              type="number"
              placeholder="Case ID optional"
              value={editForm.case_id}
              onChange={handleEditChange}
            />

            <input
              name="document_id"
              type="number"
              placeholder="Document ID optional"
              value={editForm.document_id}
              onChange={handleEditChange}
            />

            <button type="submit">Update Analysis</button>

            <button
              type="button"
              className="secondary-btn"
              onClick={resetEditForm}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="dashboard-panel ai-table-panel">
        <h2>AI Analysis List ({filteredAnalyses.length})</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Prompt</th>
              <th>Result</th>
              <th>Type</th>
              <th>User ID</th>
              <th>Case ID</th>
              <th>Document ID</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedAnalyses.map((analysis) => (
              <tr key={analysis.id}>
                <td>{analysis.id}</td>
                <td>{analysis.prompt}</td>
                <td>{analysis.result}</td>
                <td>{analysis.analysis_type || "-"}</td>
                <td>{analysis.user_id}</td>
                <td>{analysis.case_id || "-"}</td>
                <td>{analysis.document_id || "-"}</td>
                <td>
                  {analysis.created_at
                    ? new Date(analysis.created_at).toLocaleString()
                    : "-"}
                </td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(analysis)}
                  >
                    Edit
                  </button>

                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(analysis.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedAnalyses.length === 0 && (
              <tr>
                <td colSpan="9">No AI analyses found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredAnalyses.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredAnalyses.length)} of{" "}
              {filteredAnalyses.length} analyses
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
            <h2>Delete AI Analysis</h2>

            <p>Are you sure you want to permanently delete this AI analysis?</p>

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

export default AIAnalyses;
