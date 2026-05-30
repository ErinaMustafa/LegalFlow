import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { getCases } from "../../api/legalApi";
import {
  getTasks,
  getComments,
  createComment,
  updateComment,
  deleteComment
} from "../../api/operationsApi";

function Comments() {
  const userId = sessionStorage.getItem("user_id") || "";

  const [comments, setComments] = useState([]);
  const [cases, setCases] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [form, setForm] = useState({
    content: "",
    created_at: "",
    user_id: userId,
    case_id: "",
    task_id: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadComments = async () => {
    try {
      const data = await getComments();
      setComments(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load comments");
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

  const loadTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load tasks");
    }
  };

  useEffect(() => {
    loadComments();
    loadCases();
    loadTasks();
  }, []);

  useEffect(() => {
    const value = search.trim();

    if (!value) return;

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".comments-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }

    setCurrentPage(1);
  }, [search]);

  const filteredComments = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return comments;

    return comments.filter((comment) => {
      return (
        String(comment.id).includes(value) ||
        comment.content?.toLowerCase().includes(value) ||
        comment.created_at?.toLowerCase().includes(value) ||
        String(comment.user_id || "").includes(value) ||
        String(comment.case_id || "").includes(value) ||
        String(comment.task_id || "").includes(value)
      );
    });
  }, [comments, search]);

  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedComments = filteredComments.slice(startIndex, endIndex);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      content: "",
      created_at: "",
      user_id: userId,
      case_id: "",
      task_id: ""
    });

    setEditingId(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    setCurrentPage(1);

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".comments-table-panel");

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
      content: form.content,
      created_at: form.created_at || null,
      user_id: Number(form.user_id),
      case_id: form.case_id ? Number(form.case_id) : null,
      task_id: form.task_id ? Number(form.task_id) : null
    };

    try {
      setError("");

      if (editingId) {
        await updateComment(editingId, payload);
      } else {
        await createComment(payload);
      }

      resetForm();
      loadComments();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save comment");
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment.id);

    setForm({
      content: comment.content || "",
      created_at: comment.created_at ? comment.created_at.slice(0, 16) : "",
      user_id: comment.user_id || userId,
      case_id: comment.case_id || "",
      task_id: comment.task_id || ""
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

      await deleteComment(deleteId);

      setDeleteId(null);
      loadComments();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete comment");
    }
  };

  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>OPERATIONS</span>
        <h1>Comments</h1>
        <p>Manage comments connected to cases and tasks.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="dashboard-panel">
        <h2>{editingId ? "Update Comment" : "Create Comment"}</h2>

        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="content"
            placeholder="Comment content"
            value={form.content}
            onChange={handleChange}
            required
          />

          <input
            name="created_at"
            type="datetime-local"
            value={form.created_at}
            onChange={handleChange}
          />

          <input
            name="user_id"
            type="number"
            placeholder="User ID"
            value={form.user_id}
            onChange={handleChange}
            required
          />

          <select name="case_id" value={form.case_id} onChange={handleChange}>
            <option value="">No case</option>
            {cases.map((caseItem) => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.title}
              </option>
            ))}
          </select>

          <select name="task_id" value={form.task_id} onChange={handleChange}>
            <option value="">No task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>

          <button type="submit">
            {editingId ? "Update Comment" : "Create Comment"}
          </button>

          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="dashboard-panel comments-table-panel">
        <h2>Comment List ({filteredComments.length})</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Content</th>
              <th>Created At</th>
              <th>User ID</th>
              <th>Case ID</th>
              <th>Task ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedComments.map((comment) => (
              <tr key={comment.id}>
                <td>{comment.id}</td>
                <td>{comment.content}</td>
                <td>
                  {comment.created_at
                    ? new Date(comment.created_at).toLocaleString()
                    : "-"}
                </td>
                <td>{comment.user_id}</td>
                <td>{comment.case_id || "-"}</td>
                <td>{comment.task_id || "-"}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(comment)}
                  >
                    Edit
                  </button>

                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(comment.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedComments.length === 0 && (
              <tr>
                <td colSpan="7">No comments found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredComments.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredComments.length)} of{" "}
              {filteredComments.length} comments
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
            <h2>Delete Comment</h2>

            <p>Are you sure you want to permanently delete this comment?</p>

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

export default Comments;

