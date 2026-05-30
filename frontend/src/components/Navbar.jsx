

import { useEffect, useState } from "react";
import { getNotifications } from "../api/operationsApi";

function Navbar({ search, setSearch, onSearch }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (err) {
        console.log("Failed to load notifications", err);
      }
    };

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const unreadNotifications = notifications.filter(
    (item) => item.status === "Unread"
  );

  return (
    <header className="navbar">
      <form onSubmit={onSearch}>
        <input
          type="text"
          placeholder="Search clients, cases, contracts, documents..."
          value={search || ""}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <div className="notification-wrapper">
        <button
          type="button"
          className="notification-bell"
          onClick={() => setOpen((prev) => !prev)}
        >
          🔔
          {unreadNotifications.length > 0 && (
            <span className="notification-badge">
              {unreadNotifications.length}
            </span>
          )}
        </button>

        {open && (
          <div className="notification-dropdown">
            <h4>Notifications</h4>

            {unreadNotifications.length === 0 && (
              <p>No unread notifications.</p>
            )}

            {unreadNotifications.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                className="notification-item"
                onClick={() => {
                  window.location.href = "/notifications";
                }}
              >
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{item.status}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;

