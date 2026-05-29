import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children, search, setSearch, onSearch }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar
          search={search}
          setSearch={setSearch}
          onSearch={onSearch}
        />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;