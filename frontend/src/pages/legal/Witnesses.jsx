import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getCases,
  getHearings,
  getWitnesses,
  createWitness,
  updateWitness,
  deleteWitness
} from "../../api/legalApi";


function Witnesses() {
  const [witnesses, setWitnesses] = useState([]);
  const [cases, setCases] = useState([]);
  const [hearings, setHearings] = useState([]);


  const [form, setForm] = useState({
    full_name: "",
    statement: "",
    phone: "",
    email: "",
    case_id: "",
    hearing_id: ""
  });


  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;


  const loadWitnesses = async (params = {}) => {
    try {
      const data = await getWitnesses(params);
      setWitnesses(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load witnesses");
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


  const searchWitnesses = async (value) => {
    if (!isNaN(value)) {
      const idResult = witnesses.filter(
        (witness) => witness.id === Number(value)
      );


      if (idResult.length > 0) {
        setWitnesses(idResult);
        setCurrentPage(1);
        return;
      }


      const numericFields = ["case_id", "hearing_id"];


      for (const field of numericFields) {
        const data = await getWitnesses({ [field]: Number(value) });


        if (data.length > 0) {
          setWitnesses(data);
          setCurrentPage(1);
          return;
        }
      }
    }


    const fields = ["full_name", "statement", "email", "phone"];


    for (const field of fields) {
      const data = await getWitnesses({ [field]: value });


      if (data.length > 0) {
        setWitnesses(data);
        setCurrentPage(1);
        return;
      }
    }


    setWitnesses([]);
    setCurrentPage(1);
  };


  useEffect(() => {
    loadWitnesses();
    loadCases();
    loadHearings();
  }, []);


  useEffect(() => {
    const value = search.trim();


    if (!value) {
      loadWitnesses();
      return;
    }


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".witnesses-table-panel");


    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }


    const delaySearch = setTimeout(() => {
      searchWitnesses(value);
    }, 400);


    return () => clearTimeout(delaySearch);
  }, [search]);


  const totalPages = Math.ceil(witnesses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWitnesses = witnesses.slice(startIndex, endIndex);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };


  const resetForm = () => {
    setForm({
      full_name: "",
      statement: "",
      phone: "",
      email: "",
      case_id: "",
      hearing_id: ""
    });


    setEditingId(null);
  };


  const handleSearch = async (e) => {
    e.preventDefault();


    const value = search.trim();


    if (!value) {
      loadWitnesses();
      return;
    }


    await searchWitnesses(value);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();


    const payload = {
      full_name: form.full_name,
      statement: form.statement || null,
      phone: form.phone || null,
      email: form.email || null,
      case_id: Number(form.case_id),
      hearing_id: form.hearing_id ? Number(form.hearing_id) : null
    };


    try {
      setError("");


      if (editingId) {
        await updateWitness(editingId, payload);
      } else {
        await createWitness(payload);
      }


      resetForm();
      loadWitnesses();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save witness");
    }
  };


  const handleEdit = (witness) => {
    setEditingId(witness.id);


    setForm({
      full_name: witness.full_name || "",
      statement: witness.statement || "",
      phone: witness.phone || "",
      email: witness.email || "",
      case_id: witness.case_id || "",
      hearing_id: witness.hearing_id || ""
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


      await deleteWitness(deleteId);


      setDeleteId(null);
      loadWitnesses();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete witness");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>LEGAL</span>
        <h1>Witnesses</h1>
        <p>Manage witnesses linked to cases and hearings.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      <div className="dashboard-panel">
        <h2>{editingId ? "Update Witness" : "Create Witness"}</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="full_name"
            placeholder="Full name"
            value={form.full_name}
            onChange={handleChange}
            required
          />


          <input
            name="statement"
            placeholder="Statement"
            value={form.statement}
            onChange={handleChange}
          />


          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
          />


          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
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


          <button type="submit">
            {editingId ? "Update Witness" : "Create Witness"}
          </button>


          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>


      <div className="dashboard-panel witnesses-table-panel">
        <h2>Witness List ({witnesses.length})</h2>


        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Statement</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Case ID</th>
              <th>Hearing ID</th>
              <th>Actions</th>
            </tr>
          </thead>


          <tbody>
            {paginatedWitnesses.map((witness) => (
              <tr key={witness.id}>
                <td>{witness.id}</td>
                <td>{witness.full_name}</td>
                <td>{witness.statement || "-"}</td>
                <td>{witness.phone || "-"}</td>
                <td>{witness.email || "-"}</td>
                <td>{witness.case_id}</td>
                <td>{witness.hearing_id || "-"}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(witness)}
                  >
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(witness.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedWitnesses.length === 0 && (
              <tr>
                <td colSpan="8">No witnesses found.</td>
              </tr>
            )}
          </tbody>
        </table>


        {witnesses.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, witnesses.length)} of {witnesses.length} witnesses
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
            <h2>Delete Witness</h2>


            <p>Are you sure you want to permanently delete this witness?</p>


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


export default Witnesses;

