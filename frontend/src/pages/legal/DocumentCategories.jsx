import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getDocumentCategories,
  createDocumentCategory,
  updateDocumentCategory,
  deleteDocumentCategory
} from "../../api/legalApi";


function DocumentCategories() {
  const [categories, setCategories] = useState([]);


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


  const loadCategories = async (params = {}) => {
    try {
      const data = await getDocumentCategories(params);
      setCategories(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load categories");
    }
  };


  const searchCategories = async (value) => {
    if (!isNaN(value)) {
      const idResult = categories.filter(
        (category) => category.id === Number(value)
      );


      if (idResult.length > 0) {
        setCategories(idResult);
        setCurrentPage(1);
        return;
      }
    }


    const fields = ["name", "description"];


    for (const field of fields) {
      const data = await getDocumentCategories({ [field]: value });


      if (data.length > 0) {
        setCategories(data);
        setCurrentPage(1);
        return;
      }
    }


    setCategories([]);
    setCurrentPage(1);
  };


  useEffect(() => {
    loadCategories();
  }, []);


  useEffect(() => {
    const value = search.trim();


    if (!value) {
      loadCategories();
      return;
    }


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".document-categories-table-panel");


    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }


    const delaySearch = setTimeout(() => {
      searchCategories(value);
    }, 400);


    return () => clearTimeout(delaySearch);
  }, [search]);


  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = categories.slice(startIndex, endIndex);


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
      loadCategories();
      return;
    }


    await searchCategories(value);
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
        await updateDocumentCategory(editingId, payload);
      } else {
        await createDocumentCategory(payload);
      }


      resetForm();
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save category");
    }
  };


  const handleEdit = (category) => {
    setEditingId(category.id);


    setForm({
      name: category.name || "",
      description: category.description || ""
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


      await deleteDocumentCategory(deleteId);


      setDeleteId(null);
      loadCategories();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete category");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>LEGAL</span>
        <h1>Document Categories</h1>
        <p>Manage document categories used to classify legal documents.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      <div className="dashboard-panel">
        <h2>{editingId ? "Update Category" : "Create Category"}</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Category name"
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
            {editingId ? "Update Category" : "Create Category"}
          </button>


          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>


      <div className="dashboard-panel document-categories-table-panel">
        <h2>Category List ({categories.length})</h2>


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
            {paginatedCategories.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{category.description || "-"}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(category)}
                  >
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(category.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedCategories.length === 0 && (
              <tr>
                <td colSpan="4">No document categories found.</td>
              </tr>
            )}
          </tbody>
        </table>


        {categories.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} - {Math.min(endIndex, categories.length)}{" "}
              of {categories.length} categories
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
            <h2>Delete Category</h2>


            <p>Are you sure you want to permanently delete this category?</p>


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


export default DocumentCategories;

