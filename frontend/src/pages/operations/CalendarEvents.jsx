import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getCases } from "../../api/legalApi";
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} from "../../api/operationsApi";


function CalendarEvents() {
  const userId = sessionStorage.getItem("user_id") || "";


  const [events, setEvents] = useState([]);
  const [cases, setCases] = useState([]);


  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "Scheduled",
    user_id: userId,
    case_id: ""
  });


  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;


  const loadEvents = async (params = {}) => {
    try {
      const data = await getCalendarEvents(params);
      setEvents(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load calendar events");
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


  const searchEvents = async (value) => {
    if (!isNaN(value)) {
      const idResult = events.filter(
        (event) => event.id === Number(value)
      );


      if (idResult.length > 0) {
        setEvents(idResult);
        setCurrentPage(1);
        return;
      }


      const caseResult = await getCalendarEvents({ case_id: Number(value) });


      if (caseResult.length > 0) {
        setEvents(caseResult);
        setCurrentPage(1);
        return;
      }


      const userResult = await getCalendarEvents({ user_id: Number(value) });


      if (userResult.length > 0) {
        setEvents(userResult);
        setCurrentPage(1);
        return;
      }
    }


    const fields = ["title", "description", "status", "start_date", "end_date"];


    for (const field of fields) {
      const data = await getCalendarEvents({ [field]: value });


      if (data.length > 0) {
        setEvents(data);
        setCurrentPage(1);
        return;
      }
    }


    setEvents([]);
    setCurrentPage(1);
  };


  useEffect(() => {
    loadEvents();
    loadCases();
  }, []);


  useEffect(() => {
    const value = search.trim();


    if (!value) {
      loadEvents();
      return;
    }


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".calendar-events-table-panel");


    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }


    const delaySearch = setTimeout(() => {
      searchEvents(value);
    }, 400);


    return () => clearTimeout(delaySearch);
  }, [search]);


  const totalPages = Math.ceil(events.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = events.slice(startIndex, endIndex);


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
      start_date: "",
      end_date: "",
      status: "Scheduled",
      user_id: userId,
      case_id: ""
    });


    setEditingId(null);
  };


  const handleSearch = async (e) => {
    e.preventDefault();


    const value = search.trim();


    if (!value) {
      loadEvents();
      return;
    }


    await searchEvents(value);


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".calendar-events-table-panel");


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
      start_date: form.start_date,
      end_date: form.end_date || null,
      status: form.status,
      user_id: Number(form.user_id),
      case_id: form.case_id ? Number(form.case_id) : null
    };


    try {
      setError("");


      if (editingId) {
        await updateCalendarEvent(editingId, payload);
      } else {
        await createCalendarEvent(payload);
      }


      resetForm();
      loadEvents();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save calendar event");
    }
  };


  const handleEdit = (event) => {
    setEditingId(event.id);


    setForm({
      title: event.title || "",
      description: event.description || "",
      start_date: event.start_date ? event.start_date.slice(0, 16) : "",
      end_date: event.end_date ? event.end_date.slice(0, 16) : "",
      status: event.status || "Scheduled",
      user_id: event.user_id || userId,
      case_id: event.case_id || ""
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


      await deleteCalendarEvent(deleteId);


      setDeleteId(null);
      loadEvents();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete calendar event");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>OPERATIONS</span>
        <h1>Calendar Events</h1>
        <p>Manage scheduled events connected to users and cases.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      <div className="dashboard-panel">
        <h2>{editingId ? "Update Calendar Event" : "Create Calendar Event"}</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Event title"
            value={form.title}
            onChange={handleChange}
            required
          />


          <input
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />


          <input
            name="start_date"
            type="datetime-local"
            value={form.start_date}
            onChange={handleChange}
            required
          />


          <input
            name="end_date"
            type="datetime-local"
            value={form.end_date}
            onChange={handleChange}
          />


          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
          </select>


          <input
            name="user_id"
            type="number"
            placeholder="User ID"
            value={form.user_id}
            onChange={handleChange}
            required
          />


          <select
            name="case_id"
            value={form.case_id}
            onChange={handleChange}
          >
            <option value="">No case</option>
            {cases.map((caseItem) => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.title}
              </option>
            ))}
          </select>


          <button type="submit">
            {editingId ? "Update Event" : "Create Event"}
          </button>


          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>


      <div className="dashboard-panel calendar-events-table-panel">
        <h2>Calendar Event List ({events.length})</h2>


        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>User ID</th>
              <th>Case ID</th>
              <th>Actions</th>
            </tr>
          </thead>


          <tbody>
            {paginatedEvents.map((event) => (
              <tr key={event.id}>
                <td>{event.id}</td>
                <td>{event.title}</td>
                <td>{event.description || "-"}</td>
                <td>
                  {event.start_date
                    ? new Date(event.start_date).toLocaleString()
                    : "-"}
                </td>
                <td>
                  {event.end_date
                    ? new Date(event.end_date).toLocaleString()
                    : "-"}
                </td>
                <td>{event.status}</td>
                <td>{event.user_id}</td>
                <td>{event.case_id || "-"}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(event)}
                  >
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(event.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedEvents.length === 0 && (
              <tr>
                <td colSpan="9">No calendar events found.</td>
              </tr>
            )}
          </tbody>
        </table>


        {events.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, events.length)} of {events.length} events
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
            <h2>Delete Calendar Event</h2>


            <p>Are you sure you want to permanently delete this calendar event?</p>


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


export default CalendarEvents;



