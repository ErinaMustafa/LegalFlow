import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


import CourtDecisions from "../pages/legal/CourtDecisions";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout";
import Contracts from "../pages/legal/Contracts";


import Login from "../pages/auth/Login";
import Dashboard from "../pages/Dashboard";


import Hearings from "../pages/legal/Hearings";
import Clients from "../pages/operations/Clients";
import Cases from "../pages/legal/Cases";


function PlaceholderPage({ title }) {
  return (
    <Layout>
      <div className="page-header">
        <span>MODULE</span>
        <h1>{title}</h1>
        <p>This module page will be connected with backend API next.</p>
      </div>
    </Layout>
  );
}




function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />




        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager", "Finance"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />




       <Route
  path="/clients"
  element={
    <ProtectedRoute allowedRoles={["Admin", "Assistant", "Manager"]}>
      <Clients />
    </ProtectedRoute>
  }
/><Route
  path="/cases"
  element={
    <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager"]}>
      <Cases />
    </ProtectedRoute>
  }
/>
        <Route path="/case-notes" element={<ProtectedRoute allowedRoles={["Admin", "Lawyer"]}><PlaceholderPage title="Case Notes" /></ProtectedRoute>} />
<Route
  path="/contracts"
  element={
    <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager"]}>
      <Contracts />
    </ProtectedRoute>
  }
/>      
 <Route
  path="/hearings"
  element={
    <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Manager"]}>
      <Hearings />
    </ProtectedRoute>
  }
/>
        <Route
  path="/court-decisions"
  element={
    <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Manager"]}>
      <CourtDecisions />
    </ProtectedRoute>
  }
/>
        <Route path="/documents" element={<ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager"]}><PlaceholderPage title="Documents" /></ProtectedRoute>} />
        <Route path="/document-categories" element={<ProtectedRoute allowedRoles={["Admin"]}><PlaceholderPage title="Document Categories" /></ProtectedRoute>} />
        <Route path="/witnesses" element={<ProtectedRoute allowedRoles={["Admin", "Lawyer"]}><PlaceholderPage title="Witnesses" /></ProtectedRoute>} />




        <Route path="/tasks" element={<ProtectedRoute allowedRoles={["Admin", "Assistant", "Manager"]}><PlaceholderPage title="Tasks" /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager"]}><PlaceholderPage title="Calendar Events" /></ProtectedRoute>} />        <Route path="/reminders" element={<ProtectedRoute allowedRoles={["Admin", "Assistant", "Manager"]}><PlaceholderPage title="Reminders" /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute allowedRoles={["Admin", "Assistant", "Manager"]}><PlaceholderPage title="Notifications" /></ProtectedRoute>} />
        <Route path="/comments" element={<ProtectedRoute allowedRoles={["Admin", "Assistant", "Manager", "Lawyer"]}><PlaceholderPage title="Comments" /></ProtectedRoute>} />




        <Route path="/invoices" element={<ProtectedRoute allowedRoles={["Admin", "Finance", "Manager"]}><PlaceholderPage title="Invoices" /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute allowedRoles={["Admin", "Finance", "Manager"]}><PlaceholderPage title="Payments" /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute allowedRoles={["Admin", "Finance", "Manager"]}><PlaceholderPage title="Expenses" /></ProtectedRoute>} />
        <Route path="/time-entries" element={<ProtectedRoute allowedRoles={["Admin", "Finance", "Manager", "Lawyer"]}><PlaceholderPage title="Time Entries" /></ProtectedRoute>} />




        <Route path="/ai" element={<ProtectedRoute allowedRoles={["Admin", "Lawyer"]}><PlaceholderPage title="AI Analyses" /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={["Admin", "Manager"]}><PlaceholderPage title="Audit Logs" /></ProtectedRoute>} />




        <Route path="/roles" element={<ProtectedRoute allowedRoles={["Admin"]}><PlaceholderPage title="Roles" /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute allowedRoles={["Admin"]}><PlaceholderPage title="Departments" /></ProtectedRoute>} />
        <Route path="/practice-areas" element={<ProtectedRoute allowedRoles={["Admin", "Lawyer", "Manager"]}><PlaceholderPage title="Practice Areas" /></ProtectedRoute>} />




        <Route path="/admin/create-user" element={<ProtectedRoute allowedRoles={["Admin"]}><PlaceholderPage title="Create User" /></ProtectedRoute>} />
        <Route path="/admin/reset-password" element={<ProtectedRoute allowedRoles={["Admin"]}><PlaceholderPage title="Reset Password" /></ProtectedRoute>} />




        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}




export default AppRoutes;





