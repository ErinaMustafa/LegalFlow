import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import {
  getAuditLogs,
  deleteAuditLog
} from "../../api/auditApi";

function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadAuditLogs = async () => {
    try {
      const data = await getAuditLogs();
      setAuditLogs(data);
      setCurrentPage(1);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to load audit logs"
      );
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredLogs = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return auditLogs;

    return auditLogs.filter((log) => {
      return (
        String(log.id).includes(value) ||
        log.action?.toLowerCase().includes(value) ||
        log.entity_type?.toLowerCase().includes(value) ||
        log.description?.toLowerCase().includes(value)
      );
    });
  }, [auditLogs, search]);

  const totalPages = Math.ceil(
    filteredLogs.length / itemsPerPage
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const endIndex =
    startIndex + itemsPerPage;

  const paginatedLogs =
    filteredLogs.slice(startIndex, endIndex);

  const handleSearch = (e) => {
    e.preventDefault();

    const pageContent =
      document.querySelector(".page-content");

    const tablePanel =
      document.querySelector(".audit-table-panel");

    if (pageContent && tablePanel) {
      pageContent.scrollTo({
        top: tablePanel.offsetTop - 20,
        behavior: "smooth"
      });
    }
  };

  const confirmDelete = async () => {
    try {
      setError("");
      setSuccess("");

      await deleteAuditLog(deleteId);

      setDeleteId(null);

      setSuccess(
        "Audit log deleted successfully"
      );

      loadAuditLogs();
    } catch (err) {
      setDeleteId(null);

      setError(
        err.response?.data?.detail ||
        "Failed to delete audit log"
      );
    }
  };

  return (
    <Layout
      search={search}
      setSearch={setSearch}
      onSearch={handleSearch}
    >
      <div className="page-header">
        <span>AUDIT</span>

        <h1>Audit Logs</h1>

        <p>
          Monitor system activity and changes.
        </p>
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {success && (
        <div className="success-box">
          {success}
        </div>
      )}

      <div className="dashboard-panel audit-table-panel">
        <h2>
          Audit Logs ({filteredLogs.length})
        </h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Description</th>
              <th>User ID</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>

                <td>{log.action}</td>

                <td>{log.entity_type}</td>

                <td>{log.description}</td>

                <td>{log.user_id || "-"}</td>

                <td>
                  {log.created_at
                    ? new Date(
                        log.created_at
                      ).toLocaleString()
                    : "-"}
                </td>

                <td>
                  <button
                    className="table-btn danger"
                    onClick={() =>
                      setDeleteId(log.id)
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {paginatedLogs.length === 0 && (
              <tr>
                <td colSpan="7">
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredLogs.length > 0 && (
          <div className="pagination">
            <span>
              Showing {startIndex + 1} -{" "}
              {Math.min(
                endIndex,
                filteredLogs.length
              )}{" "}
              of {filteredLogs.length} logs
            </span>

            <div className="pagination-buttons">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage(
                    (prev) => prev - 1
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {currentPage} of{" "}
                {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (prev) => prev + 1
                  )
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
            <h2>Delete Audit Log</h2>

            <p>
              Are you sure you want to
              permanently delete this audit
              log?
            </p>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() =>
                  setDeleteId(null)
                }
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

export default AuditLogs;
