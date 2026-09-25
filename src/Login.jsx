import { useState } from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { apiFetch } from "./lib/api";

const DEMO_EMAIL = "admin@mit.asia";
const DEMO_PASSWORD = "admin123";

export default function Login({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login/json", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data.detail;
        setError(typeof detail === "string" ? detail : "Invalid email or password");
        return;
      }
      localStorage.setItem("ecopulse_token", data.access_token);
      localStorage.setItem("ecopulse_user", JSON.stringify(data.user));
      if (onLoginSuccess) onLoginSuccess(data.user);
      else if (onClose) onClose();
    } catch {
      setError("Cannot reach API. Start the backend on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-card" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="logo-icon admin-logo-icon" style={{ width: "32px", height: "32px" }}>
              <Building2 size={18} />
            </div>
            <h2>Campus Administrator Login</h2>
          </div>
          {onClose && (
            <button
              type="button"
              className="login-close-x"
              onClick={onClose}
              aria-label="Close modal"
            >
              &times;
            </button>
          )}
        </div>

        <p className="login-subtitle">
          Authorized access only for Dean, Facility Operations &amp; Environmental Audit Officers.
        </p>

        <div className="login-demo-hint">
          <span>
            Demo login: <strong>{DEMO_EMAIL}</strong> / <strong>{DEMO_PASSWORD}</strong>
          </span>
          <button type="button" className="login-demo-fill" onClick={fillDemo}>
            Autofill
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="admin-email">Admin Institutional Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mit.asia"
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            <ShieldCheck size={16} />
            {loading ? "Signing in..." : "Sign In to Admin Portal"}
          </button>
        </form>
      </div>
    </div>
  );
}
