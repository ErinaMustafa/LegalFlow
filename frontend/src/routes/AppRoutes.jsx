import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Witnesses from "../pages/legal/Witnesses";
import Appointments from "../pages/operations/Appointments";
import Tasks from "../pages/operations/Tasks";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout";
import CalendarEvents from "../pages/operations/CalendarEvents";
import Reminders from "../pages/operations/Reminders";
import Comments from "../pages/operations/Comments";
import Notifications from "../pages/operations/Notifications";
import Invoices from "../pages/finance/Invoices";
import Payments from "../pages/finance/Payments";
import Expenses from "../pages/finance/Expenses";
import TimeEntries from "../pages/finance/TimeEntries";


import CreateUser from "../pages/admin/CreateUser";
import ResetPassword from "../pages/admin/ResetPassword";
import Departments from "../pages/admin/Departments";
import Roles from "../pages/admin/Roles";
import PracticeAreas from "../pages/admin/PracticeAreas";


import Login from "../pages/auth/Login";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/admin/Users";
import Clients from "../pages/operations/Clients";


import AIAnalyses from "../pages/ai/AIAnalyses";
import AuditLogs from "../pages/audit/AuditLogs";


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
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Users />
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
        <Route
          path="/reminders"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager"]}>
              <Reminders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Assistant", "Manager"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comments"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Assistant", "Manager", "Lawyer"]}>
              <Comments />
            </ProtectedRoute>
          }
        />


        <Route
          path="/invoices"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Finance", "Manager"]}>
              <Invoices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Finance"]}>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Finance"]}>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/time-entries"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Lawyer", "Manager", "Finance"]}
            >
              <TimeEntries />
            </ProtectedRoute>
          }
        />


        <Route
          path="/departments"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Departments />
            </ProtectedRoute>
          }
        />


        <Route
          path="/ai"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Lawyer"]}>
              <AIAnalyses />
            </ProtectedRoute>
          }
        />


        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />


        <Route
          path="/roles"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Roles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice-areas"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Lawyer", "Manager"]}>
              <PracticeAreas />
            </ProtectedRoute>
          }
        />


        <Route
          path="/create-user"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <CreateUser />
            </ProtectedRoute>
          }
        />


        <Route
          path="/reset-password"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ResetPassword />
            </ProtectedRoute>
          }
        />


        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


export default AppRoutes;





