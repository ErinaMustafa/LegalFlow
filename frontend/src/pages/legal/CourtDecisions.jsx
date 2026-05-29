import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getCases,
  getHearings,
  getCourtDecisions,
  createCourtDecision,
  updateCourtDecision,
  deleteCourtDecision
} from "../../api/legalApi";


function CourtDecisions() {
  const [decisions, setDecisions] = useState([]);
  const [cases, setCases] = useState([]);
  const [hearings, setHearings] = useState([]);


  const [form, setForm] = useState({
    title: "",
    decision_text: "",
    decision_date: "",
    status: "Issued",
    case_id: "",
    hearing_id: "",
    document_id: ""
  });


  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;


  const loadDecisions = async (params = {}) => {
    try {
      const data = await getCourtDecisions(params);
      setDecisions(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load court decisions");
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


  const loadHearings = async () => {
    try {
      const data = await getHearings();
      setHearings(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load hearings");
    }
  };


  const searchDecisions = async (value) => {
    if (!isNaN(value)) {
      const idResult = decisions.filter(
        (decision) => decision.id === Number(value)
      );


      if (idResult.length > 0) {
        setDecisions(idResult);
        setCurrentPage(1);
        return;
      }


      const numericFields = ["case_id", "hearing_id", "document_id"];


      for (const field of numericFields) {
        const data = await getCourtDecisions({
          [field]: Number(value)
        });


        if (data.length > 0) {
          setDecisions(data);
          setCurrentPage(1);
          return;
        }
      }
    }


    const fields = ["title", "decision_text", "status"];


    for (const field of fields) {
      const data = await getCourtDecisions({
        [field]: value
      });


      if (data.length > 0) {
        setDecisions(data);
        setCurrentPage(1);
        return;
      }
    }


    setDecisions([]);
    setCurrentPage(1);
  };


  useEffect(() => {
    loadDecisions();
    loadCases();
    loadHearings();
  }, []);


  useEffect(() => {
    const value = search.trim();


    if (!value) {
      loadDecisions();
      return;
    }


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".court-decisions-table-panel");


    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }


    const delaySearch = setTimeout(() => {
      searchDecisions(value);
    }, 400);


    return () => clearTimeout(delaySearch);
  }, [search]);


  const totalPages = Math.ceil(decisions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDecisions = decisions.slice(startIndex, endIndex);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };


  const resetForm = () => {
    setForm({
      title: "",
      decision_text: "",
      decision_date: "",
      status: "Issued",
      case_id: "",
      hearing_id: "",
      document_id: ""
    });


    setEditingId(null);
  };


  const handleSearch = async (e) => {
    e.preventDefault();


    const value = search.trim();


    if (!value) {
      loadDecisions();
      return;
    }


    await searchDecisions(value);


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".court-decisions-table-panel");


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
      decision_text: form.decision_text,
      decision_date: form.decision_date || null,
      status: form.status,
      case_id: Number(form.case_id),
      hearing_id: form.hearing_id ? Number(form.hearing_id) : null,
      document_id: form.document_id ? Number(form.document_id) : null
    };


    try {
      setError("");


      if (editingId) {
        await updateCourtDecision(editingId, payload);
      } else {
        await createCourtDecision(payload);
      }


      resetForm();
      loadDecisions();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save court decision");
    }
  };


  const handleEdit = (decision) => {
    setEditingId(decision.id);


    setForm({
      title: decision.title || "",
      decision_text: decision.decision_text || "",
      decision_date: decision.decision_date
        ? decision.decision_date.slice(0, 16)
        : "",
      status: decision.status || "Issued",
      case_id: decision.case_id || "",
      hearing_id: decision.hearing_id || "",
      document_id: decision.document_id || ""
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


      await deleteCourtDecision(deleteId);


      setDeleteId(null);
      loadDecisions();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete court decision");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>LEGAL</span>
        <h1>Court Decisions</h1>
        <p>Manage court decisions linked to cases, hearings and documents.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      <div className="dashboard-panel">
        <h2>{editingId ? "Update Court Decision" : "Create Court Decision"}</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Decision title"
            value={form.title}
            onChange={handleChange}
            required
          />


          <input
            name="decision_text"
            placeholder="Decision text"
            value={form.decision_text}
            onChange={handleChange}
            required
          />


          <input
            name="decision_date"
            type="datetime-local"
            value={form.decision_date}
            onChange={handleChange}
          />


          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option value="Issued">Issued</option>
            <option value="Pending">Pending</option>
            <option value="Appealed">Appealed</option>
            <option value="Final">Final</option>
          </select>


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
            name="hearing_id"
            value={form.hearing_id}
            onChange={handleChange}
          >
            <option value="">Select hearing optional</option>
            {hearings.map((hearing) => (
              <option key={hearing.id} value={hearing.id}>
                {hearing.title}
              </option>
            ))}
          </select>


          <input
            name="document_id"
            type="number"
            placeholder="Document ID optional"
            value={form.document_id}
            onChange={handleChange}
          />


          <button type="submit">
            {editingId ? "Update Decision" : "Create Decision"}
          </button>


          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>


      <div className="dashboard-panel court-decisions-table-panel">
        <h2>Court Decision List ({decisions.length})</h2>


        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Decision</th>
              <th>Date</th>
              <th>Status</th>
              <th>Case ID</th>
              <th>Hearing ID</th>
              <th>Document ID</th>
              <th>Actions</th>
            </tr>
          </thead>


          <tbody>
            {paginatedDecisions.map((decision) => (
              <tr key={decision.id}>
                <td>{decision.id}</td>
                <td>{decision.title}</td>
                <td>{decision.decision_text}</td>
                <td>
                  {decision.decision_date
                    ? new Date(decision.decision_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>{decision.status}</td>
                <td>{decision.case_id}</td>
                <td>{decision.hearing_id || "-"}</td>
                <td>{decision.document_id || "-"}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(decision)}
                  >
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(decision.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedDecisions.length === 0 && (
              <tr>
                <td colSpan="9">No court decisions found.</td>
              </tr>
            )}
          </tbody>
        </table>


        {decisions.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, decisions.length)} of {decisions.length} court decisions
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
            <h2>Delete Court Decision</h2>


            <p>Are you sure you want to permanently delete this court decision?</p>


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


export default CourtDecisions;

