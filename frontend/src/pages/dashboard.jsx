import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="page-header">
        <span>OVERVIEW</span>
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.username}. Here is your LegalFlow workspace.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Open Cases</span>
          <h3>0</h3>
          <p>Active litigation matters</p>
        </div>

        <div className="stat-card">
          <span>Contracts</span>
          <h3>0</h3>
          <p>Drafts and active agreements</p>
        </div>

        <div className="stat-card">
          <span>Tasks</span>
          <h3>0</h3>
          <p>Pending workflow items</p>
        </div>

        <div className="stat-card">
          <span>Invoices</span>
          <h3>0</h3>
          <p>Financial tracking</p>
        </div>
      </div>

      <div className="dashboard-panel">
        <h2>Recent activity</h2>
        <p>No recent activity yet.</p>
      </div>
    </Layout>
  );
}

export default Dashboard;