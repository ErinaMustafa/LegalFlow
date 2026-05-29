import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient
} from "../../api/operationsApi";


function Clients() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: ""
  });


  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");


  const loadClients = async (params = {}) => {
  try {
    const data = await getClients(params);
    setClients(data);
    setCurrentPage(1);
  } catch (err) {
    setError(err.response?.data?.detail || "Failed to load clients");
  }
};

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

const searchClients = async (value) => {
  // Search by ID locally
  if (!isNaN(value)) {
    const idResult = clients.filter(
      (client) => client.id === Number(value)
    );

    if (idResult.length > 0) {
      setClients(idResult);
      setCurrentPage(1);
      return;
    }
  }

  const fields = ["full_name", "email", "phone", "address"];

  for (const field of fields) {
    const data = await getClients({
      [field]: value
    });

    if (data.length > 0) {
      setClients(data);
      setCurrentPage(1);
      return;
    }
  }

  setClients([]);
  setCurrentPage(1);
};

  useEffect(() => {
  loadClients();
}, []);

useEffect(() => {
  const value = search.trim();

  if (!value) {
    loadClients();
    return;
  }

  const pageContent = document.querySelector(".page-content");
  const tablePanel = document.querySelector(".clients-table-panel");

  if (pageContent && tablePanel) {
    pageContent.scrollTo({
      top: tablePanel.offsetTop - 20,
      behavior: "auto"
    });
  }

  const delaySearch = setTimeout(() => {
    searchClients(value);
  }, 400);

  return () => clearTimeout(delaySearch);
}, [search]);

  const totalPages = Math.ceil(clients.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedClients = clients.slice(startIndex, endIndex);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };


  const resetForm = () => {
    setForm({
      full_name: "",
      email: "",
      phone: "",
      address: ""
    });


    setEditingId(null);
  };

const handleSearch = async (e) => {
  e.preventDefault();

  const value = search.trim();

  if (!value) {
    loadClients();
    return;
  }

  await searchClients(value);

const pageContent = document.querySelector(".page-content");
const tablePanel = document.querySelector(".clients-table-panel");

if (pageContent && tablePanel) {
  pageContent.scrollTo({
    top: tablePanel.offsetTop - 20,
    behavior: "smooth"
  });
}
};


  const handleSubmit = async (e) => {
    e.preventDefault();


    try {
      setError("");


      if (editingId) {
        await updateClient(editingId, form);
      } else {
        await createClient(form);
      }


      resetForm();
      loadClients();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save client");
    }
  };


  const handleEdit = (client) => {
    setEditingId(client.id);


    setForm({
      full_name: client.full_name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || ""
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


      await deleteClient(deleteId);


      setDeleteId(null);
      loadClients();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete client");
    }
  };


  return (
    <Layout
  search={search}
  setSearch={setSearch}
  onSearch={handleSearch}
>
      <div className="page-header">
        <span>OPERATIONS</span>
        <h1>Clients</h1>
        <p>Manage external legal clients linked to cases, contracts and invoices.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      <div className="dashboard-panel">
        <h2>{editingId ? "Update Client" : "Create Client"}</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="full_name"
            placeholder="Full name"
            value={form.full_name}
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


          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
          />


          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
          />


          <button type="submit">
            {editingId ? "Update Client" : "Create Client"}
          </button>


          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>


      <div className="dashboard-panel clients-table-panel">
        <h2>Client List ({clients.length})</h2>
            

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>


          <tbody>
          {paginatedClients.map((client) => (
              <tr key={client.id}>
                <td>{client.id}</td>
                <td>{client.full_name}</td>
                <td>{client.email}</td>
                <td>{client.phone || "-"}</td>
                <td>{client.address || "-"}</td>
                <td>
                  <button className="table-btn" onClick={() => handleEdit(client)}>
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(client.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedClients.length === 0 && (
              <tr>
                <td colSpan="6">No clients found.</td>
              </tr>
            )}
          </tbody>
        </table>
        {clients.length > 0 && (
  <div className="pagination">
    <span>
      Showing {startIndex + 1} -
      {Math.min(endIndex, clients.length)}
      {" "}of {clients.length} clients
    </span>

    <div className="pagination-buttons">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() =>
          setCurrentPage((prev) => prev - 1)
        }
      >
        Previous
      </button>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() =>
          setCurrentPage((prev) => prev + 1)
        }
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
            <h2>Delete Client</h2>


            <p>
              Are you sure you want to permanently delete this client?
            </p>


            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>


              <button
                className="danger-btn"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}


export default Clients;

