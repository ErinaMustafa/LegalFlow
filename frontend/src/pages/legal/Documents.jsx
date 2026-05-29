import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  getCases,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentCategories
} from "../../api/legalApi";

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title: "",
    file_url: "",
    document_type: "",
    case_id: "",
    category_id: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadDocuments = async (params = {}) => {
    try {
      const data = await getDocuments(params);
      setDocuments(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load documents");
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

  const loadCategories = async () => {
    try {
      const data = await getDocumentCategories();
      setCategories(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load document categories");
    }
  };

  const searchDocuments = async (value) => {
    if (!isNaN(value)) {
      const idResult = documents.filter(
        (document) => document.id === Number(value)
      );

      if (idResult.length > 0) {
        setDocuments(idResult);
        setCurrentPage(1);
        return;
      }

      const numericFields = ["case_id", "category_id"];

      for (const field of numericFields) {
        const data = await getDocuments({ [field]: Number(value) });

        if (data.length > 0) {
          setDocuments(data);
          setCurrentPage(1);
          return;
        }
      }
    }

    const fields = ["title", "document_type"];

    for (const field of fields) {
      const data = await getDocuments({ [field]: value });

      if (data.length > 0) {
        setDocuments(data);
        setCurrentPage(1);
        return;
      }
    }

    setDocuments([]);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadDocuments();
    loadCases();
    loadCategories();
  }, []);

  useEffect(() => {
    const value = search.trim();

    if (!value) {
      loadDocuments();
      return;
    }

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".documents-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "auto"
      });
    }

    const delaySearch = setTimeout(() => {
      searchDocuments(value);
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [search]);

  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = documents.slice(startIndex, endIndex);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      title: "",
      file_url: "",
      document_type: "",
      case_id: "",
      category_id: ""
    });

    setEditingId(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const value = search.trim();

    if (!value) {
      loadDocuments();
      return;
    }

    await searchDocuments(value);

    const pageContent = document.querySelector(".page-content");
    const tablePanel = document.querySelector(".documents-table-panel");

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
      file_url: form.file_url || null,
      document_type: form.document_type || null,
      case_id: Number(form.case_id),
      category_id: form.category_id ? Number(form.category_id) : null
    };

    try {
      setError("");

      if (editingId) {
        await updateDocument(editingId, payload);
      } else {
        await createDocument(payload);
      }

      resetForm();
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save document");
    }
  };

  const handleEdit = (document) => {
    setEditingId(document.id);

    setForm({
      title: document.title || "",
      file_url: document.file_url || "",
      document_type: document.document_type || "",
      case_id: document.case_id || "",
      category_id: document.category_id || ""
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

      await deleteDocument(deleteId);

      setDeleteId(null);
      loadDocuments();
    } catch (err) {
      setDeleteId(null);
      setError(err.response?.data?.detail || "Failed to delete document");
    }
  };

  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>LEGAL</span>
        <h1>Documents</h1>
        <p>Manage legal documents linked to cases and document categories.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="dashboard-panel">
        <h2>{editingId ? "Update Document" : "Create Document"}</h2>

        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Document title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <input
            name="file_url"
            placeholder="File URL"
            value={form.file_url}
            onChange={handleChange}
          />

          <input
            name="document_type"
            placeholder="Document type"
            value={form.document_type}
            onChange={handleChange}
          />

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

          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
          >
            <option value="">Select category optional</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <button type="submit">
            {editingId ? "Update Document" : "Create Document"}
          </button>

          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="dashboard-panel documents-table-panel">
        <h2>Document List ({documents.length})</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>File URL</th>
              <th>Case ID</th>
              <th>Category ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedDocuments.map((document) => (
              <tr key={document.id}>
                <td>{document.id}</td>
                <td>{document.title}</td>
                <td>{document.document_type || "-"}</td>
                <td>
                  {document.file_url ? (
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{document.case_id}</td>
                <td>{document.category_id || "-"}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => handleEdit(document)}
                  >
                    Edit
                  </button>

                  <button
                    className="table-btn danger"
                    onClick={() => setDeleteId(document.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedDocuments.length === 0 && (
              <tr>
                <td colSpan="7">No documents found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {documents.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} - {Math.min(endIndex, documents.length)}{" "}
              of {documents.length} documents
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
            <h2>Delete Document</h2>

            <p>Are you sure you want to permanently delete this document?</p>

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

export default Documents;