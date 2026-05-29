import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} from "../../api/operationsApi";


function Tasks() {
  const [tasks, setTasks] = useState([]);


  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "To Do",
    priority: "Medium",
    case_id: ""
  });


  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;


  const loadTasks = async (params = {}) => {
    try {
      const data = await getTasks(params);
      setTasks(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load tasks");
    }
  };


  const searchTasks = async (value) => {
    if (!isNaN(value)) {
      const idResult = tasks.filter(
        (task) => task.id === Number(value)
      );


      if (idResult.length > 0) {
        setTasks(idResult);
        setCurrentPage(1);
        return;
      }


      const data = await getTasks({ case_id: Number(value) });


      if (data.length > 0) {
        setTasks(data);
        setCurrentPage(1);
        return;
      }
    }


    const fields = ["title", "description", "status", "priority"];


    for (const field of fields) {
      const data = await getTasks({ [field]: value });


      if (data.length > 0) {
        setTasks(data);
        setCurrentPage(1);
        return;
      }
    }


    setTasks([]);
    setCurrentPage(1);
  };


  useEffect(() => {
    loadTasks();
  }, []);


  useEffect(() => {
    const value = search.trim();


    if (!value) {
      loadTasks();
      return;
    }


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".tasks-table-panel");


    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }


    const delaySearch = setTimeout(() => {
      searchTasks(value);
    }, 400);


    return () => clearTimeout(delaySearch);
  }, [search]);


  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = tasks.slice(startIndex, endIndex);


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
      status: "To Do",
      priority: "Medium",
      case_id: ""
    });


    setEditingId(null);
  };


  const handleSearch = async (e) => {
    e.preventDefault();


    const value = search.trim();


    if (!value) {
      loadTasks();
      return;
    }


    await searchTasks(value);


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".tasks-table-panel");


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
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      case_id: Number(form.case_id)
    };


    try {
      setError("");


      if (editingId) {
        await updateTask(editingId, payload);
      } else {
        await createTask(payload);
      }


      resetForm();
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save task");
    }
  };


  const handleEdit = (task) => {
    setEditingId(task.id);


    setForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "To Do",
      priority: task.priority || "Medium",
      case_id: task.case_id || ""
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


      await deleteTask(deleteId);


      setDeleteId(null);
      loadTasks();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete task");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>OPERATIONS</span>
        <h1>Tasks</h1>
        <p>Manage case-related tasks and priorities.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      <div className="dashboard-panel">
        <h2>{editingId ? "Update Task" : "Create Task"}</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Task title"
            value={form.title}
            onChange={handleChange}
            required
          />


          <input
            name="description"
            placeholder="Task description"
            value={form.description}
            onChange={handleChange}
          />


          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>


          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            required
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>


          <input
            name="case_id"
            type="number"
            placeholder="Case ID"
            value={form.case_id}
            onChange={handleChange}
            required
          />


          <button type="submit">
            {editingId ? "Update Task" : "Create Task"}
          </button>


          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>


      <div className="dashboard-panel tasks-table-panel">
        <h2>Task List ({tasks.length})</h2>


        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created At</th>
              <th>Case ID</th>
              <th>Actions</th>
            </tr>
          </thead>


          <tbody>
            {paginatedTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>{task.description || "-"}</td>
                <td>{task.status}</td>
                <td>{task.priority}</td>
                <td>
                  {task.created_at
                    ? new Date(task.created_at).toLocaleDateString()
                    : "-"}
                </td>
                <td>{task.case_id}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(task)}
                  >
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(task.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedTasks.length === 0 && (
              <tr>
                <td colSpan="8">No tasks found.</td>
              </tr>
            )}
          </tbody>
        </table>


        {tasks.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, tasks.length)} of {tasks.length} tasks
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
            <h2>Delete Task</h2>


            <p>Are you sure you want to permanently delete this task?</p>


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


export default Tasks;

