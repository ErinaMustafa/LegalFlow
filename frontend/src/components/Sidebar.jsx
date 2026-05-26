import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

function Sidebar() {
  const { user, logout } = useAuth();

  const menuByRole = {
    Admin: [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Create User", path: "/admin/create-user" },
      { label: "Reset Password", path: "/admin/reset-password" },
      { label: "Roles", path: "/roles" },
      { label: "Departments", path: "/departments" },
      { label: "Clients", path: "/clients" },
      { label: "Cases", path: "/cases" },
      { label: "Contracts", path: "/contracts" },
      { label: "Hearings", path: "/hearings" },
      { label: "Court Decisions", path: "/court-decisions" },
      { label: "Documents", path: "/documents" },
      { label: "Tasks", path: "/tasks" },
      { label: "Calendar", path: "/calendar" },
      { label: "Invoices", path: "/invoices" },
      { label: "Payments", path: "/payments" },
      { label: "Expenses", path: "/expenses" },
      { label: "AI Analyses", path: "/ai" },
      { label: "Audit Logs", path: "/audit-logs" },
    ],

    Lawyer: [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Cases", path: "/cases" },
      { label: "Contracts", path: "/contracts" },
      { label: "Hearings", path: "/hearings" },
      { label: "Court Decisions", path: "/court-decisions" },
      { label: "Documents", path: "/documents" },
      { label: "Case Notes", path: "/case-notes" },
      { label: "Witnesses", path: "/witnesses" },
      { label: "AI Analyses", path: "/ai" },
    ],

    Assistant: [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Clients", path: "/clients" },
      { label: "Tasks", path: "/tasks" },
      { label: "Calendar", path: "/calendar" },
      { label: "Appointments", path: "/appointments" },
      { label: "Reminders", path: "/reminders" },
      { label: "Notifications", path: "/notifications" },
      { label: "Comments", path: "/comments" },
      { label: "Cases", path: "/cases" },
      { label: "Contracts", path: "/contracts" },
    ],

    Manager: [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Clients", path: "/clients" },
      { label: "Cases", path: "/cases" },
      { label: "Contracts", path: "/contracts" },
      { label: "Invoices", path: "/invoices" },
      { label: "Payments", path: "/payments" },
      { label: "Expenses", path: "/expenses" },
      { label: "Tasks", path: "/tasks" },
      { label: "Calendar", path: "/calendar" },
      { label: "Audit Logs", path: "/audit-logs" },
    ],

    Finance: [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Invoices", path: "/invoices" },
      { label: "Payments", path: "/payments" },
      { label: "Expenses", path: "/expenses" },
      { label: "Financial Reports", path: "/finance/reports" },
    ],
  };

  const menuItems = menuByRole[user?.role] || [
    { label: "Dashboard", path: "/dashboard" },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">
          <div className="logo-box">⚖</div>
          <div>
            <h2>LegalFlow</h2>
            <p>{user?.username || "User"}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
           <Link key={item.path} to={item.path}>
                {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="sidebar-user">
        <div className="avatar">
          {user?.username?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <div>
          <strong>{user?.username}</strong>
          <p>{user?.role}</p>
        </div>

        <button onClick={logout}>Sign out</button>
      </div>
    </aside>
  );
}

export default Sidebar;