import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getPracticeAreas,
  createPracticeArea,
  updatePracticeArea,
  deletePracticeArea
} from "../../api/adminApi";


function PracticeAreas() {
  const [practiceAreas, setPracticeAreas] = useState([]);


  const [form, setForm] = useState({
    name: "",
    description: ""
  });


  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;


  const loadPracticeAreas = async (params = {}) => {
    try {
      const data = await getPracticeAreas(params);
      setPracticeAreas(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load practice areas");
    }
  };


  const searchPracticeAreas = async (value) => {
    if (!isNaN(value)) {
      const idResult = practiceAreas.filter(
        (practiceArea) => practiceArea.id === Number(value)
      );


      if (idResult.length > 0) {
        setPracticeAreas(idResult);
        setCurrentPage(1);
        return;
      }
    }


    const fields = ["name", "description"];


    for (const field of fields) {
      const data = await getPracticeAreas({ [field]: value });


      if (data.length > 0) {
        setPracticeAreas(data);
        setCurrentPage(1);
        return;
      }
    }


    setPracticeAreas([]);
    setCurrentPage(1);
  };


  useEffect(() => {
    loadPracticeAreas();
  }, []);


  useEffect(() => {
    const value = search.trim();


    if (!value) {
      loadPracticeAreas();
      return;
    }


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".practice-areas-table-panel");


    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }


    const delaySearch = setTimeout(() => {
      searchPracticeAreas(value);
    }, 400);


    return () => clearTimeout(delaySearch);
  }, [search]);


  const totalPages = Math.ceil(practiceAreas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPracticeAreas = practiceAreas.slice(startIndex, endIndex);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };


  const resetForm = () => {
    setForm({
      name: "",
      description: ""
    });


    setEditingId(null);
  };


  const handleSearch = async (e) => {
    e.preventDefault();


    const value = search.trim();


    if (!value) {
      loadPracticeAreas();
      return;
    }


    await searchPracticeAreas(value);


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".practice-areas-table-panel");


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
      name: form.name,
      description: form.description || null
    };


    try {
      setError("");


      if (editingId) {
        await updatePracticeArea(editingId, payload);
      } else {
        await createPracticeArea(payload);
      }


      resetForm();
      loadPracticeAreas();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save practice area");
    }
  };


  const handleEdit = (practiceArea) => {
    setEditingId(practiceArea.id);


    setForm({
      name: practiceArea.name || "",
      description: practiceArea.description || ""
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


      await deletePracticeArea(deleteId);


      setDeleteId(null);
      loadPracticeAreas();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete practice area");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>ADMINISTRATION</span>
        <h1>Practice Areas</h1>
        <p>Manage legal practice areas used by cases.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      <div className="dashboard-panel">
        <h2>{editingId ? "Update Practice Area" : "Create Practice Area"}</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Practice area name"
            value={form.name}
            onChange={handleChange}
            required
          />


          <input
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />


          <button type="submit">
            {editingId ? "Update Practice Area" : "Create Practice Area"}
          </button>


          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>


      <div className="dashboard-panel practice-areas-table-panel">
        <h2>Practice Area List ({practiceAreas.length})</h2>


        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>


          <tbody>
            {paginatedPracticeAreas.map((practiceArea) => (
              <tr key={practiceArea.id}>
                <td>{practiceArea.id}</td>
                <td>{practiceArea.name}</td>
                <td>{practiceArea.description || "-"}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(practiceArea)}
                  >
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(practiceArea.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedPracticeAreas.length === 0 && (
              <tr>
                <td colSpan="4">No practice areas found.</td>
              </tr>
            )}
          </tbody>
        </table>


        {practiceAreas.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, practiceAreas.length)} of{" "}
              {practiceAreas.length} practice areas
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
            <h2>Delete Practice Area</h2>


            <p>Are you sure you want to permanently delete this practice area?</p>


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


export default PracticeAreas;

