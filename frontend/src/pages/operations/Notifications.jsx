import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getNotifications,
  updateNotification,
  deleteNotification
} from "../../api/operationsApi";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadNotifications = async (params = {}) => {
    try {
      const data = await getNotifications(params);
      setNotifications(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load notifications");
    }
  };

  const searchNotifications = async (value) => {
    if (!isNaN(value)) {
      const idResult = notifications.filter(
        (notification) => notification.id === Number(value)
      );

      if (idResult.length > 0) {
        setNotifications(idResult);
        setCurrentPage(1);
        return;
      }

      const fields = ["user_id", "case_id", "task_id", "hearing_id"];

      for (const field of fields) {
        const data = await getNotifications({ [field]: Number(value) });

        if (data.length > 0) {
          setNotifications(data);
          setCurrentPage(1);
          return;
        }
      }
    }

    const fields = ["title", "message", "status", "created_at"];

    for (const field of fields) {
      const data = await getNotifications({ [field]: value });

      if (data.length > 0) {
        setNotifications(data);
        setCurrentPage(1);
        return;
      }
    }

    setNotifications([]);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const value = search.trim();

    if (!value) {
      loadNotifications();
      return;
    }

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".notifications-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }

    const delaySearch = setTimeout(() => {
      searchNotifications(value);
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [search]);

  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = notifications.slice(startIndex, endIndex);

  const handleSearch = async (e) => {
    e.preventDefault();

    const value = search.trim();

    if (!value) {
      loadNotifications();
      return;
    }

    await searchNotifications(value);

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".notifications-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "smooth"
      });
    }
  };

  const markAsRead = async (notification) => {
    try {
      setError("");

      await updateNotification(notification.id, {
        title: notification.title,
        message: notification.message,
        status: "Read",
        created_at: notification.created_at,
        user_id: notification.user_id,
        case_id: notification.case_id,
        task_id: notification.task_id,
        hearing_id: notification.hearing_id
      });

      loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to mark notification as read"
      );
    }
  };

  const confirmDelete = async () => {
    try {
      setError("");

      await deleteNotification(deleteId);

      setDeleteId(null);
      loadNotifications();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete notification");
    }
  };

  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>OPERATIONS</span>
        <h1>Notifications</h1>
        <p>View system notifications created automatically by actions.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="dashboard-panel notifications-table-panel">
        <h2>Notification List ({notifications.length})</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Message</th>
              <th>Status</th>
              <th>Created At</th>
              <th>User ID</th>
              <th>Case ID</th>
              <th>Task ID</th>
              <th>Hearing ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedNotifications.map((notification) => (
              <tr key={notification.id}>
                <td>{notification.id}</td>
                <td>{notification.title}</td>
                <td>{notification.message}</td>
                <td>{notification.status}</td>
                <td>
                  {notification.created_at
                    ? new Date(notification.created_at).toLocaleString()
                    : "-"}
                </td>
                <td>{notification.user_id}</td>
                <td>{notification.case_id || "-"}</td>
                <td>{notification.task_id || "-"}</td>
                <td>{notification.hearing_id || "-"}</td>
                <td>
                  {notification.status === "Unread" && (
                    <button
                      className="table-btn"
                      onClick={() => markAsRead(notification)}
                    >
                      Mark Read
                    </button>
                  )}

                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(notification.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedNotifications.length === 0 && (
              <tr>
                <td colSpan="10">No notifications found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {notifications.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, notifications.length)} of{" "}
              {notifications.length} notifications
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
            <h2>Delete Notification</h2>

            <p>Are you sure you want to permanently delete this notification?</p>

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

export default Notifications;

