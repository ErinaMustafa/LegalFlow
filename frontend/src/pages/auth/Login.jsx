import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../App.css";

function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const user = await login(email, password);

      
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-left">
        <div className="brand">
          <div className="brand-icon">⚖</div>
          <div>
            <h1>LegalFlow</h1>
            <p>Contract & Case Tracking System</p>
          </div>
        </div>

        <div className="hero-text">
          <span>LEGAL OPERATIONS</span>
          <h2>
            Manage cases, contracts, clients and legal workflows in one secure system.
          </h2>
          <p>
            Internal company platform for lawyers, assistants, managers and finance teams.
          </p>
        </div>
      </section>

      <section className="login-right">
        <form className="login-card" onSubmit={handleSubmit} autoComplete="off">
          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to continue to LegalFlow</p>

          <label>Email</label>
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password} autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="error-box">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Login;