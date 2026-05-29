import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getCases,
  getContracts,
  createContract,
  updateContract,
  deleteContract
} from "../../api/legalApi";


function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [cases, setCases] = useState([]);


  const [form, setForm] = useState({
    title: "",
    contract_type: "",
    status: "Draft",
    start_date: "",
    end_date: "",
    case_id: ""
  });


  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;


  const loadContracts = async (params = {}) => {
    try {
      const data = await getContracts(params);
      setContracts(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load contracts");
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


  const searchContracts = async (value) => {
    if (!isNaN(value)) {
      const idResult = contracts.filter(
        (contract) => contract.id === Number(value)
      );


      if (idResult.length > 0) {
        setContracts(idResult);
        setCurrentPage(1);
        return;
      }


      const data = await getContracts({ case_id: Number(value) });


      if (data.length > 0) {
        setContracts(data);
        setCurrentPage(1);
        return;
      }
    }


    const fields = ["title", "contract_type", "status"];


    for (const field of fields) {
      const data = await getContracts({ [field]: value });


      if (data.length > 0) {
        setContracts(data);
        setCurrentPage(1);
        return;
      }
    }


    setContracts([]);
    setCurrentPage(1);
  };


  useEffect(() => {
    loadContracts();
    loadCases();
  }, []);


  useEffect(() => {
    const value = search.trim();


    if (!value) {
      loadContracts();
      return;
    }


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".contracts-table-panel");


    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }


    const delaySearch = setTimeout(() => {
      searchContracts(value);
    }, 400);


    return () => clearTimeout(delaySearch);
  }, [search]);


  const totalPages = Math.ceil(contracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContracts = contracts.slice(startIndex, endIndex);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };


  const resetForm = () => {
    setForm({
      title: "",
      contract_type: "",
      status: "Draft",
      start_date: "",
      end_date: "",
      case_id: ""
    });


    setEditingId(null);
  };


  const handleSearch = async (e) => {
    e.preventDefault();


    const value = search.trim();


    if (!value) {
      loadContracts();
      return;
    }


    await searchContracts(value);


    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".contracts-table-panel");


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
      contract_type: form.contract_type || null,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      case_id: Number(form.case_id)
    };


    try {
      setError("");


      if (editingId) {
        await updateContract(editingId, payload);
      } else {
        await createContract(payload);
      }


      resetForm();
      loadContracts();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save contract");
    }
  };


  const handleEdit = (contract) => {
    setEditingId(contract.id);


    setForm({
      title: contract.title || "",
      contract_type: contract.contract_type || "",
      status: contract.status || "Draft",
      start_date: contract.start_date ? contract.start_date.slice(0, 16) : "",
      end_date: contract.end_date ? contract.end_date.slice(0, 16) : "",
      case_id: contract.case_id || ""
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


      await deleteContract(deleteId);


      setDeleteId(null);
      loadContracts();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete contract");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>LEGAL</span>
        <h1>Contracts</h1>
        <p>Manage legal contracts connected to cases.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      <div className="dashboard-panel">
        <h2>{editingId ? "Update Contract" : "Create Contract"}</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Contract title"
            value={form.title}
            onChange={handleChange}
            required
          />


          <input
            name="contract_type"
            placeholder="Contract type"
            value={form.contract_type}
            onChange={handleChange}
          />


          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Terminated">Terminated</option>
          </select>


          <select
            name="case_id"
            value={form.case_id}
            onChange={handleChange}
            required
          >
            <option value="">Select case</option>
            {cases.map((caseItem) => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.title}
              </option>
            ))}
          </select>


          <input
            name="start_date"
            type="datetime-local"
            value={form.start_date}
            onChange={handleChange}
          />


          <input
            name="end_date"
            type="datetime-local"
            value={form.end_date}
            onChange={handleChange}
          />


          <button type="submit">
            {editingId ? "Update Contract" : "Create Contract"}
          </button>


          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>


      <div className="dashboard-panel contracts-table-panel">
        <h2>Contract List ({contracts.length})</h2>


        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Start</th>
              <th>End</th>
              <th>Case ID</th>
              <th>Actions</th>
            </tr>
          </thead>


          <tbody>
            {paginatedContracts.map((contract) => (
              <tr key={contract.id}>
                <td>{contract.id}</td>
                <td>{contract.title}</td>
                <td>{contract.contract_type || "-"}</td>
                <td>{contract.status}</td>
                <td>
                  {contract.start_date
                    ? new Date(contract.start_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  {contract.end_date
                    ? new Date(contract.end_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>{contract.case_id}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(contract)}
                  >
                    Edit
                  </button>


                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(contract.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}


            {paginatedContracts.length === 0 && (
              <tr>
                <td colSpan="8">No contracts found.</td>
              </tr>
            )}
          </tbody>
        </table>


        {contracts.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, contracts.length)} of {contracts.length} contracts
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
            <h2>Delete Contract</h2>


            <p>Are you sure you want to permanently delete this contract?</p>


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


export default Contracts;

