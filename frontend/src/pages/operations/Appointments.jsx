import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getCases } from "../../api/legalApi";
import {
  getClients,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment
} from "../../api/operationsApi";


function Appointments() {
  const userId = sessionStorage.getItem("user_id") || "";


  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);


  const [form, setForm] = useState({
    title: "",
    description: "",
    appointment_date: "",
    location: "",
    status: "Scheduled",
    user_id: userId,
    client_id: "",
    case_id: ""
  });


  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;


  const loadAppointments = async (params = {}) => {
    try {
      const data = await getAppointments(params);
      setAppointments(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load appointments");
    }
  };


  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load clients");
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


  const searchAppointments = async (value) => {
    if (!isNaN(value)) {
      const idResult = appointments.filter(
        (appointment) => appointment.id === Number(value)
      );


      if (idResult.length > 0) {
        setAppointments(idResult);
        setCurrentPage(1);
        return;
      }


      const fields = ["user_id", "client_id", "case_id"];


      for (const field of fields) {
        const data = await getAppointments({ [field]: Number(value) });


        if (data.length > 0) {
          setAppointments(data);
          setCurrentPage(1);
          return;
        }
      }
    }


    const fields = [
      "title",
      "description",
      "location",
      "status",
      "appointment_date"
    ];


    for (const field of fields) {
      const data = await getAppointments({ [field]: value });


      if (data.length > 0) {
        setAppointments(data);
        setCurrentPage(1);
        return;
      }
    }


    setAppointments([]);
    setCurrentPage(1);
  };


  useEffect(() => {
    loadAppointments();
    loadClients();
    loadCases();
  }, []);


  useEffect(() => {
    const value = search.trim();


    if (!value) {
      loadAppointments();
      return;
    }


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".appointments-table-panel");


    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }


    const delaySearch = setTimeout(() => {
      searchAppointments(value);
    }, 400);


    return () => clearTimeout(delaySearch);
  }, [search]);


  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = appointments.slice(startIndex, endIndex);


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
      appointment_date: "",
      location: "",
      status: "Scheduled",
      user_id: userId,
      client_id: "",
      case_id: ""
    });


    setEditingId(null);
  };


  const handleSearch = async (e) => {
    e.preventDefault();


    const value = search.trim();


    if (!value) {
      loadAppointments();
      return;
    }


    await searchAppointments(value);


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".appointments-table-panel");


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
      appointment_date: form.appointment_date,
      location: form.location || null,
      status: form.status,
      user_id: Number(form.user_id),
      client_id: form.client_id ? Number(form.client_id) : null,
      case_id: form.case_id ? Number(form.case_id) : null
    };


    try {
      setError("");


      if (editingId) {
        await updateAppointment(editingId, payload);
      } else {
        await createAppointment(payload);
      }


      resetForm();
      loadAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save appointment");
    }
  };


  const handleEdit = (appointment) => {
    setEditingId(appointment.id);


    setForm({
      title: appointment.title || "",
      description: appointment.description || "",
      appointment_date: appointment.appointment_date
        ? appointment.appointment_date.slice(0, 16)
        : "",
      location: appointment.location || "",
      status: appointment.status || "Scheduled",
      user_id: appointment.user_id || userId,
      client_id: appointment.client_id || "",
      case_id: appointment.case_id || ""
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


      await deleteAppointment(deleteId);


      setDeleteId(null);
      loadAppointments();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete appointment");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>OPERATIONS</span>
        <h1>Appointments</h1>
        <p>Manage client and case appointments.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      <div className="dashboard-panel">
        <h2>{editingId ? "Update Appointment" : "Create Appointment"}</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Appointment title"
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
            name="appointment_date"
            type="datetime-local"
            value={form.appointment_date}
            onChange={handleChange}
            required
          />


          <input
            name="location"
            placeholder="Location"
            value={form.location}
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
            name="client_id"
            value={form.client_id}
            onChange={handleChange}
          >
            <option value="">No client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>


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
            {editingId ? "Update Appointment" : "Create Appointment"}
          </button>


          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>


      <div className="dashboard-panel appointments-table-panel">
        <h2>Appointment List ({appointments.length})</h2>


        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Date</th>
              <th>Location</th>
              <th>Status</th>
              <th>User ID</th>
              <th>Client ID</th>
              <th>Case ID</th>
              <th>Actions</th>
            </tr>
          </thead>


          <tbody>
            {paginatedAppointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.id}</td>
                <td>{appointment.title}</td>
                <td>
                  {appointment.appointment_date
                    ? new Date(appointment.appointment_date).toLocaleString()
                    : "-"}
                </td>
                <td>{appointment.location || "-"}</td>
                <td>{appointment.status}</td>
                <td>{appointment.user_id}</td>
                <td>{appointment.client_id || "-"}</td>
                <td>{appointment.case_id || "-"}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(appointment)}
                  >
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(appointment.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedAppointments.length === 0 && (
              <tr>
                <td colSpan="9">No appointments found.</td>
              </tr>
            )}
          </tbody>
        </table>


        {appointments.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, appointments.length)} of{" "}
              {appointments.length} appointments
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
            <h2>Delete Appointment</h2>


            <p>Are you sure you want to permanently delete this appointment?</p>


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


export default Appointments;

