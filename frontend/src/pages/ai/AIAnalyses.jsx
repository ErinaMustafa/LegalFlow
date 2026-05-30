import Layout from "../../components/Layout";
import { useState } from "react";


function AIAnalyses() {
  const [search, setSearch] = useState("");


  const handleSearch = (e) => {
    e.preventDefault();
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>AI</span>
        <h1>AI Analyses</h1>
        <p>Manage AI analysis records.</p>
      </div>


      <div className="dashboard-panel">
        <h2>AI Analyses</h2>
        <p>This page will be connected next.</p>
      </div>
    </Layout>
  );
}


export default AIAnalyses;

