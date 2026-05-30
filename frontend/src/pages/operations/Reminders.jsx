import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getTasks,
  getCalendarEvents,
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder
} from "../../api/operationsApi";
import { getHearings } from "../../api/legalApi";

function Reminders() {
  const userId = sessionStorage.getItem("user_id") || "";

  const [reminders, setReminders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  const [form, setForm] = useState({
    title: "",
    message: "",
    reminder_date: "",
    user_id: userId,
    task_id: "",
    hearing_id: "",
    calendar_event_id: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadReminders = async (params = {}) => {
    try {
      const data = await getReminders(params);
      setReminders(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load reminders");
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

  const loadHearings = async () => {
    try {
      const data = await getHearings();
      setHearings(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load hearings");
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const data = await getCalendarEvents();
      setCalendarEvents(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load calendar events");
    }
  };

  const searchReminders = async (value) => {
    if (!isNaN(value)) {
      const idResult = reminders.filter(
        (reminder) => reminder.id === Number(value)
      );

      if (idResult.length > 0) {
        setReminders(idResult);
        setCurrentPage(1);
        return;
      }

      const fields = ["user_id", "task_id", "hearing_id", "calendar_event_id"];

      for (const field of fields) {
        const data = await getReminders({ [field]: Number(value) });

        if (data.length > 0) {
          setReminders(data);
          setCurrentPage(1);
          return;
        }
      }
    }

    const fields = ["title", "message", "status", "reminder_date"];

    for (const field of fields) {
      const data = await getReminders({ [field]: value });

      if (data.length > 0) {
        setReminders(data);
        setCurrentPage(1);
        return;
      }
    }

    setReminders([]);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadReminders();
    loadTasks();
    loadHearings();
    loadCalendarEvents();
  }, []);

  useEffect(() => {
    const value = search.trim();

    if (!value) {
      loadReminders();
      return;
    }

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".reminders-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }

    const delaySearch = setTimeout(() => {
      searchReminders(value);
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [search]);

  const totalPages = Math.ceil(reminders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReminders = reminders.slice(startIndex, endIndex);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      title: "",
      message: "",
      reminder_date: "",
      user_id: userId,
      task_id: "",
      hearing_id: "",
      calendar_event_id: ""
    });

    setEditingId(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const value = search.trim();

    if (!value) {
      loadReminders();
      return;
    }

    await searchReminders(value);

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".reminders-table-panel");

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
      message: form.message,
      reminder_date: form.reminder_date,
      user_id: Number(form.user_id),
      task_id: form.task_id ? Number(form.task_id) : null,
      hearing_id: form.hearing_id ? Number(form.hearing_id) : null,
      calendar_event_id: form.calendar_event_id
        ? Number(form.calendar_event_id)
        : null
    };

    try {
      setError("");

      if (editingId) {
        await updateReminder(editingId, payload);
      } else {
        await createReminder(payload);
      }

      resetForm();
      loadReminders();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save reminder");
    }
  };

  const handleEdit = (reminder) => {
    setEditingId(reminder.id);

    setForm({
      title: reminder.title || "",
      message: reminder.message || "",
      reminder_date: reminder.reminder_date
        ? reminder.reminder_date.slice(0, 16)
        : "",
      user_id: reminder.user_id || userId,
      task_id: reminder.task_id || "",
      hearing_id: reminder.hearing_id || "",
      calendar_event_id: reminder.calendar_event_id || ""
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

      await deleteReminder(deleteId);

      setDeleteId(null);
      loadReminders();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete reminder");
    }
  };

  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>OPERATIONS</span>
        <h1>Reminders</h1>
        <p>Manage reminders for tasks, hearings, and calendar events.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="dashboard-panel">
        <h2>{editingId ? "Update Reminder" : "Create Reminder"}</h2>

        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Reminder title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <input
            name="message"
            placeholder="Reminder message"
            value={form.message}
            onChange={handleChange}
            required
          />

          <input
            name="reminder_date"
            type="datetime-local"
            value={form.reminder_date}
            onChange={handleChange}
            required
          />

          <input
            name="user_id"
            type="number"
            placeholder="User ID"
            value={form.user_id}
            onChange={handleChange}
            required
          />

          <select name="task_id" value={form.task_id} onChange={handleChange}>
            <option value="">No task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>

          <select
            name="hearing_id"
            value={form.hearing_id}
            onChange={handleChange}
          >
            <option value="">No hearing</option>
            {hearings.map((hearing) => (
              <option key={hearing.id} value={hearing.id}>
                {hearing.title}
              </option>
            ))}
          </select>

          <select
            name="calendar_event_id"
            value={form.calendar_event_id}
            onChange={handleChange}
          >
            <option value="">No calendar event</option>
            {calendarEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>

          <button type="submit">
            {editingId ? "Update Reminder" : "Create Reminder"}
          </button>

          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="dashboard-panel reminders-table-panel">
        <h2>Reminder List ({reminders.length})</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Message</th>
              <th>Date</th>
              <th>Status</th>
              <th>User ID</th>
              <th>Task ID</th>
              <th>Hearing ID</th>
              <th>Calendar ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedReminders.map((reminder) => (
              <tr key={reminder.id}>
                <td>{reminder.id}</td>
                <td>{reminder.title}</td>
                <td>{reminder.message}</td>
                <td>
                  {reminder.reminder_date
                    ? new Date(reminder.reminder_date).toLocaleString()
                    : "-"}
                </td>
                <td>{reminder.status}</td>
                <td>{reminder.user_id}</td>
                <td>{reminder.task_id || "-"}</td>
                <td>{reminder.hearing_id || "-"}</td>
                <td>{reminder.calendar_event_id || "-"}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(reminder)}
                  >
                    Edit
                  </button>

                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(reminder.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedReminders.length === 0 && (
              <tr>
                <td colSpan="10">No reminders found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {reminders.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, reminders.length)} of {reminders.length} reminders
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
            <h2>Delete Reminder</h2>

            <p>Are you sure you want to permanently delete this reminder?</p>

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

export default Reminders;
