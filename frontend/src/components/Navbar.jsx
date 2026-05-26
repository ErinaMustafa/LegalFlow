function Navbar() {
  return (
    <header className="navbar">
      <input
        type="text"
        placeholder="Search clients, cases, contracts, documents..."
      />
      <span className="bell">🔔</span>
    </header>
  );
}

export default Navbar;