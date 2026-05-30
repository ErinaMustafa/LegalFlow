import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import {
  getUsers,
  getRoles,
  getDepartments,
  updateUser,
  deleteUser
} from "../../api/adminApi";


function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);


  const [form, setForm] = useState({
    username: "",
    email: "",
    role_id: "",
    department_id: "",
    password: ""
  });


  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);


  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;


  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load users");
    }
  };


  const loadRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load roles");
    }
  };


  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load departments");
    }
  };


  useEffect(() => {
    loadUsers();
    loadRoles();
    loadDepartments();
  }, []);


  useEffect(() => {
    setCurrentPage(1);
  }, [search]);


  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();


    if (!value) return users;


    return users.filter((user) => {
      return (
        String(user.id).includes(value) ||
        user.username?.toLowerCase().includes(value) ||
        user.email?.toLowerCase().includes(value) ||
        String(user.role_id || "").includes(value) ||
        String(user.department_id || "").includes(value)
      );
    });
  }, [users, search]);


  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);


  const getRoleName = (roleId) => {
    const role = roles.find((item) => item.id === roleId);
    return role ? role.name : roleId || "-";
  };


  const getDepartmentName = (departmentId) => {
    const department = departments.find((item) => item.id === departmentId);
    return department ? department.name : departmentId || "-";
  };


  const handleSearch = (e) => {
    e.preventDefault();


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".users-table-panel");


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


  const resetForm = () => {
    setEditingId(null);


    setForm({
      username: "",
      email: "",
      role_id: "",
      department_id: "",
      password: ""
    });
  };


  const handleEdit = (user) => {
    setEditingId(user.id);


    setForm({
      username: user.username || "",
      email: user.email || "",
      role_id: user.role_id || "",
      department_id: user.department_id || "",
      password: ""
    });


    const pageContent = document.querySelector(".page-content");


    if (pageContent) {
      pageContent.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();


    if (!editingId) return;


    const payload = {
      username: form.username,
      email: form.email,
      role_id: Number(form.role_id),
      department_id: form.department_id ? Number(form.department_id) : null,
      password: form.password || null
    };


    try {
      setError("");
      setSuccess("");


      const data = await updateUser(editingId, payload);


      setSuccess(data.message || "User updated successfully");


      resetForm();
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update user");
    }
  };


  const confirmDelete = async () => {
    try {
      setError("");
      setSuccess("");


      await deleteUser(deleteId);


      setDeleteId(null);
      setSuccess("User deleted successfully");
      loadUsers();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete user");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>ADMINISTRATION</span>
        <h1>Users</h1>
        <p>View, update, and delete system users.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      {success && <div className="success-box">{success}</div>}


      {editingId && (
        <div className="dashboard-panel">
          <h2>Update User</h2>


          <form className="module-form" onSubmit={handleSubmit}>
            <input
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
            />


            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />


            <select
              name="role_id"
              value={form.role_id}
              onChange={handleChange}
              required
            >
              <option value="">Select role</option>


              {roles
                .filter((role) => role.name !== "Client")
                .map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
            </select>


            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
            >
              <option value="">No department</option>


              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>


            <input
              name="password"
              type="password"
              placeholder="New password optional"
              value={form.password}
              onChange={handleChange}
            />


            <button type="submit">Update User</button>


            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          </form>
        </div>
      )}


      <div className="dashboard-panel users-table-panel">
        <h2>User List ({filteredUsers.length})</h2>


        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>


          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{getRoleName(user.role_id)}</td>
                <td>{getDepartmentName(user.department_id)}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(user)}
                  >
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan="6">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>


        {filteredUsers.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
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
            <h2>Delete User</h2>


            <p>Are you sure you want to permanently delete this user?</p>


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


export default Users;

