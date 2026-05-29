import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getCases,
  getHearings,
  createHearing,
  updateHearing,
  deleteHearing
} from "../../api/legalApi";


function Hearings() {
  const [hearings, setHearings] = useState([]);
  const [cases, setCases] = useState([]);


  const [form, setForm] = useState({
    title: "",
    court_name: "",
    hearing_date: "",
    status: "Scheduled",
    case_id: ""
  });


  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;


  const loadHearings = async (params = {}) => {
    try {
      const data = await getHearings(params);
      setHearings(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load hearings");
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


  const searchHearings = async (value) => {
    if (!isNaN(value)) {
      const idResult = hearings.filter(
        (hearing) => hearing.id === Number(value)
      );


      if (idResult.length > 0) {
        setHearings(idResult);
        setCurrentPage(1);
        return;
      }


      const data = await getHearings({ case_id: Number(value) });


      if (data.length > 0) {
        setHearings(data);
        setCurrentPage(1);
        return;
      }
    }


    const fields = ["title", "court_name", "status"];


    for (const field of fields) {
      const data = await getHearings({ [field]: value });


      if (data.length > 0) {
        setHearings(data);
        setCurrentPage(1);
        return;
      }
    }


    setHearings([]);
    setCurrentPage(1);
  };


  useEffect(() => {
    loadHearings();
    loadCases();
  }, []);


  useEffect(() => {
    const value = search.trim();


    if (!value) {
      loadHearings();
      return;
    }


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".hearings-table-panel");


    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }


    const delaySearch = setTimeout(() => {
      searchHearings(value);
    }, 400);


    return () => clearTimeout(delaySearch);
  }, [search]);


  const totalPages = Math.ceil(hearings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHearings = hearings.slice(startIndex, endIndex);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };


  const resetForm = () => {
    setForm({
      title: "",
      court_name: "",
      hearing_date: "",
      status: "Scheduled",
      case_id: ""
    });


    setEditingId(null);
  };


  const handleSearch = async (e) => {
    e.preventDefault();


    const value = search.trim();


    if (!value) {
      loadHearings();
      return;
    }


    await searchHearings(value);


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".hearings-table-panel");


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
      court_name: form.court_name || null,
      hearing_date: form.hearing_date,
      status: form.status,
      case_id: Number(form.case_id)
    };


    try {
      setError("");


      if (editingId) {
        await updateHearing(editingId, payload);
      } else {
        await createHearing(payload);
      }


      resetForm();
      loadHearings();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save hearing");
    }
  };


  const handleEdit = (hearing) => {
    setEditingId(hearing.id);


    setForm({
      title: hearing.title || "",
      court_name: hearing.court_name || "",
      hearing_date: hearing.hearing_date
        ? hearing.hearing_date.slice(0, 16)
        : "",
      status: hearing.status || "Scheduled",
      case_id: hearing.case_id || ""
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


      await deleteHearing(deleteId);


      setDeleteId(null);
      loadHearings();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete hearing");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>LEGAL</span>
        <h1>Hearings</h1>
        <p>Manage court hearings connected to legal cases.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      <div className="dashboard-panel">
        <h2>{editingId ? "Update Hearing" : "Create Hearing"}</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Hearing title"
            value={form.title}
            onChange={handleChange}
            required
          />


          <input
            name="court_name"
            placeholder="Court name"
            value={form.court_name}
            onChange={handleChange}
          />


          <input
            name="hearing_date"
            type="datetime-local"
            value={form.hearing_date}
            onChange={handleChange}
            required
          />


          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Postponed">Postponed</option>
            <option value="Cancelled">Cancelled</option>
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


          <button type="submit">
            {editingId ? "Update Hearing" : "Create Hearing"}
          </button>


          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>


      <div className="dashboard-panel hearings-table-panel">
        <h2>Hearing List ({hearings.length})</h2>


        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Court</th>
              <th>Date</th>
              <th>Status</th>
              <th>Case ID</th>
              <th>Actions</th>
            </tr>
          </thead>


          <tbody>
            {paginatedHearings.map((hearing) => (
              <tr key={hearing.id}>
                <td>{hearing.id}</td>
                <td>{hearing.title}</td>
                <td>{hearing.court_name || "-"}</td>
                <td>
                  {hearing.hearing_date
                    ? new Date(hearing.hearing_date).toLocaleString()
                    : "-"}
                </td>
                <td>{hearing.status}</td>
                <td>{hearing.case_id}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(hearing)}
                  >
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(hearing.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedHearings.length === 0 && (
              <tr>
                <td colSpan="7">No hearings found.</td>
              </tr>
            )}
          </tbody>
        </table>


        {hearings.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} - {Math.min(endIndex, hearings.length)}{" "}
              of {hearings.length} hearings
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
            <h2>Delete Hearing</h2>


            <p>Are you sure you want to permanently delete this hearing?</p>


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


export default Hearings;

