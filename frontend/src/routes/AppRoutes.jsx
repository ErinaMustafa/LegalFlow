import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Witnesses from "../pages/legal/Witnesses";
import Appointments from "../pages/operations/Appointments";
import Tasks from "../pages/operations/Tasks";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout";
import CalendarEvents from "../pages/operations/CalendarEvents";






import Login from "../pages/auth/Login";
import Dashboard from "../pages/Dashboard";








import Clients from "../pages/operations/Clients";








import Cases from "../pages/legal/Cases";
import Contracts from "../pages/legal/Contracts";
import Hearings from "../pages/legal/Hearings";
import CourtDecisions from "../pages/legal/CourtDecisions";
import Documents from "../pages/legal/Documents";
import DocumentCategories from "../pages/legal/DocumentCategories";








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
        />








        <Route
          path="/cases"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager"]}>
              <Cases />
            </ProtectedRoute>
          }
        />








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








        <Route
          path="/documents"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager"]}>
              <Documents />
            </ProtectedRoute>
          }
        />








        <Route path="/case-notes" element={<ProtectedRoute allowedRoles={["Admin", "Lawyer"]}><PlaceholderPage title="Case Notes" /></ProtectedRoute>} />
        <Route
  path="/document-categories"
  element={
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DocumentCategories />
    </ProtectedRoute>
  }
/>
        <Route
  path="/witnesses"
  element={
    <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager"]}>
      <Witnesses />
    </ProtectedRoute>
  }
/>




       <Route
  path="/tasks"
  element={
    <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager"]}>
      <Tasks />
    </ProtectedRoute>
  }
/>
       <Route
  path="/calendar"
  element={
    <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager"]}>
      <CalendarEvents />
    </ProtectedRoute>
  }
/>
       <Route
  path="/appointments"
  element={
    <ProtectedRoute allowedRoles={["Admin", "Assistant", "Manager"]}>
      <Appointments />
    </ProtectedRoute>
  }
/>
        <Route path="/reminders" element={<ProtectedRoute allowedRoles={["Admin", "Assistant", "Manager"]}><PlaceholderPage title="Reminders" /></ProtectedRoute>} />
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















