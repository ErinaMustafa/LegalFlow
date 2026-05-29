import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";


function Sidebar() {
  const { user, logout } = useAuth();


  const menuByRole = {
    Admin: [
      { type: "group", label: "Dashboard" },
      { label: "Dashboard", path: "/dashboard" },


      { type: "group", label: "Administration" },
      { label: "Create User", path: "/admin/create-user" },
      { label: "Reset Password", path: "/admin/reset-password" },
      { label: "Roles", path: "/roles" },
      { label: "Departments", path: "/departments" },


      { type: "group", label: "Legal Management" },
      { label: "Practice Areas", path: "/practice-areas" },
      { label: "Cases", path: "/cases" },
      { label: "Case Notes", path: "/case-notes" },
      { label: "Contracts", path: "/contracts" },
      { label: "Hearings", path: "/hearings" },
      { label: "Court Decisions", path: "/court-decisions" },
      { label: "Documents", path: "/documents" },
      { label: "Document Categories", path: "/document-categories" },
      { label: "Witnesses", path: "/witnesses" },


      { type: "group", label: "Operations" },
      { label: "Clients", path: "/clients" },
      { label: "Tasks", path: "/tasks" },
      { label: "Calendar", path: "/calendar" },
      { label: "Appointments", path: "/appointments" },
      { label: "Reminders", path: "/reminders" },
      { label: "Notifications", path: "/notifications" },
      { label: "Comments", path: "/comments" },


      { type: "group", label: "Finance" },
      { label: "Invoices", path: "/invoices" },
      { label: "Payments", path: "/payments" },
      { label: "Expenses", path: "/expenses" },
      { label: "Time Entries", path: "/time-entries" },


      { type: "group", label: "AI & Audit" },
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


  const sidebarRef = useRef(null);


  useEffect(() => {
    const savedScroll = sessionStorage.getItem("sidebarScroll");


    if (sidebarRef.current && savedScroll) {
      sidebarRef.current.scrollTop = Number(savedScroll);
    }
  }, []);


  const handleSidebarScroll = () => {
    if (sidebarRef.current) {
      sessionStorage.setItem(
        "sidebarScroll",
        sidebarRef.current.scrollTop
      );
    }
  };


  return (
    <aside
      className="sidebar"
      ref={sidebarRef}
      onScroll={handleSidebarScroll}
    >
      <div>
        <div className="sidebar-brand">
          <div className="logo-box">⚖</div>


          <div>
            <h2>LegalFlow</h2>
            <p>{user?.username || "User"}</p>
          </div>
        </div>


        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            if (item.type === "group") {
              return (
                <div
                  key={`group-${index}`}
                  className="sidebar-group-title"
                >
                  {item.label}
                </div>
              );
            }


            return (
              <Link key={item.path} to={item.path}>
                {item.label}
              </Link>
            );
          })}
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

