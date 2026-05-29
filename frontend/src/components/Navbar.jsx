function Navbar({ search, setSearch, onSearch }) {
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

      <span className="bell">🔔</span>
    </header>
  );
}

export default Navbar;