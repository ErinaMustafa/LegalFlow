import Layout from "../../components/Layout";
import { useState } from "react";


function AuditLogs() {
  const [search, setSearch] = useState("");


  const handleSearch = (e) => {
    e.preventDefault();
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>AUDIT</span>
        <h1>Audit Logs</h1>
        <p>View system activity logs.</p>
      </div>


      <div className="dashboard-panel">
        <h2>Audit Logs</h2>
        <p>This page will be connected next.</p>
      </div>
    </Layout>
  );
}


export default AuditLogs;

