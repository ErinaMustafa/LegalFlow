import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole
} from "../../api/adminApi";


function Roles() {
  const [roles, setRoles] = useState([]);


  const [form, setForm] = useState({
    name: ""
  });


  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;


  const loadRoles = async (params = {}) => {
    try {
      const data = await getRoles(params);
      setRoles(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load roles");
    }
  };


  const searchRoles = async (value) => {
    if (!isNaN(value)) {
      const idResult = roles.filter((role) => role.id === Number(value));


      if (idResult.length > 0) {
        setRoles(idResult);
        setCurrentPage(1);
        return;
      }
    }


    const data = await getRoles({ name: value });


    if (data.length > 0) {
      setRoles(data);
      setCurrentPage(1);
      return;
    }


    setRoles([]);
    setCurrentPage(1);
  };


  useEffect(() => {
    loadRoles();
  }, []);


  useEffect(() => {
    const value = search.trim();


    if (!value) {
      loadRoles();
      return;
    }


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".roles-table-panel");


    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }


    const delaySearch = setTimeout(() => {
      searchRoles(value);
    }, 400);


    return () => clearTimeout(delaySearch);
  }, [search]);


  const totalPages = Math.ceil(roles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = roles.slice(startIndex, endIndex);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };


  const resetForm = () => {
    setForm({
      name: ""
    });


    setEditingId(null);
  };


  const handleSearch = async (e) => {
    e.preventDefault();


    const value = search.trim();


    if (!value) {
      loadRoles();
      return;
    }


    await searchRoles(value);


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".roles-table-panel");


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
      name: form.name
    };


    try {
      setError("");


      if (editingId) {
        await updateRole(editingId, payload);
      } else {
        await createRole(payload);
      }


      resetForm();
      loadRoles();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save role");
    }
  };


  const handleEdit = (role) => {
    setEditingId(role.id);


    setForm({
      name: role.name || ""
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


      await deleteRole(deleteId);


      setDeleteId(null);
      loadRoles();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete role");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>ADMINISTRATION</span>
        <h1>Roles</h1>
        <p>Manage system roles and permissions.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      <div className="dashboard-panel">
        <h2>{editingId ? "Update Role" : "Create Role"}</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Role name"
            value={form.name}
            onChange={handleChange}
            required
          />


          <button type="submit">
            {editingId ? "Update Role" : "Create Role"}
          </button>


          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>


      <div className="dashboard-panel roles-table-panel">
        <h2>Role List ({roles.length})</h2>


        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>


          <tbody>
            {paginatedRoles.map((role) => (
              <tr key={role.id}>
                <td>{role.id}</td>
                <td>{role.name}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(role)}
                  >
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(role.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedRoles.length === 0 && (
              <tr>
                <td colSpan="3">No roles found.</td>
              </tr>
            )}
          </tbody>
        </table>


        {roles.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, roles.length)} of {roles.length} roles
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
            <h2>Delete Role</h2>


            <p>Are you sure you want to permanently delete this role?</p>


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


export default Roles;

