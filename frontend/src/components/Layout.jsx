import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;