import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

import { getCases, getContracts, getDocuments, getHearings } from "../api/legalApi";
import { getTasks, getClients, getNotifications } from "../api/operationsApi";
import { getInvoices, getPayments, getExpenses, getTimeEntries } from "../api/financeApi";
import { getUsers } from "../api/adminApi";

function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    cases: 0,
    contracts: 0,
    tasks: 0,
    invoices: 0,
    clients: 0,
    documents: 0,
    hearings: 0,
    payments: 0,
    expenses: 0,
    timeEntries: 0,
    users: 0,
    notifications: 0
  });

  useEffect(() => {
    const loadDashboard = async () => {
      const [
        cases,
        contracts,
        tasks,
        invoices,
        clients,
        documents,
        hearings,
        payments,
        expenses,
        timeEntries,
        users,
        notifications
      ] = await Promise.all([
        getCases().catch(() => []),
        getContracts().catch(() => []),
        getTasks().catch(() => []),
        getInvoices().catch(() => []),
        getClients().catch(() => []),
        getDocuments().catch(() => []),
        getHearings().catch(() => []),
        getPayments().catch(() => []),
        getExpenses().catch(() => []),
        getTimeEntries().catch(() => []),
        getUsers().catch(() => []),
        getNotifications().catch(() => [])
      ]);

      setStats({
        cases: cases.length,
        contracts: contracts.length,
        tasks: tasks.length,
        invoices: invoices.length,
        clients: clients.length,
        documents: documents.length,
        hearings: hearings.length,
        payments: payments.length,
        expenses: expenses.length,
        timeEntries: timeEntries.length,
        users: users.length,
        notifications: notifications.length
      });
    };

    loadDashboard();
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <span>OVERVIEW</span>
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.username}. Here is your LegalFlow workspace.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Cases</span>
          <h3>{stats.cases}</h3>
          <p>Total legal cases</p>
        </div>

        <div className="stat-card">
          <span>Contracts</span>
          <h3>{stats.contracts}</h3>
          <p>Total agreements</p>
        </div>

        <div className="stat-card">
          <span>Tasks</span>
          <h3>{stats.tasks}</h3>
          <p>Workflow items</p>
        </div>

        <div className="stat-card">
          <span>Invoices</span>
          <h3>{stats.invoices}</h3>
          <p>Financial tracking</p>
        </div>
      </div>

      <div className="dashboard-panel">
        <h2>System Overview</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>Area</th>
              <th>Total</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Clients</td>
              <td>{stats.clients}</td>
              <td>Registered clients</td>
            </tr>

            <tr>
              <td>Documents</td>
              <td>{stats.documents}</td>
              <td>Legal documents stored</td>
            </tr>

            <tr>
              <td>Hearings</td>
              <td>{stats.hearings}</td>
              <td>Scheduled court hearings</td>
            </tr>

            <tr>
              <td>Payments</td>
              <td>{stats.payments}</td>
              <td>Recorded payments</td>
            </tr>

            <tr>
              <td>Expenses</td>
              <td>{stats.expenses}</td>
              <td>Case and office expenses</td>
            </tr>

            <tr>
              <td>Time Entries</td>
              <td>{stats.timeEntries}</td>
              <td>Logged billable hours</td>
            </tr>

            <tr>
              <td>Users</td>
              <td>{stats.users}</td>
              <td>System users</td>
            </tr>

            <tr>
              <td>Notifications</td>
              <td>{stats.notifications}</td>
              <td>System notifications</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Dashboard;


