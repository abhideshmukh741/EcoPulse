import { Building2, ShieldCheck, FileText, BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer({ onOpenAdmin }) {
  return (
    <footer className="footer">
      <div className="footer-main-grid">
        <div className="footer-brand-section">
          <Link to="/" className="logo" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="logo-icon admin-logo-icon">
              <Building2 size={20} />
            </div>
            EcoPulse • Green Campus
          </Link>

          <p>EcoPulse University, Green Campus</p>

            Dedicated administrative portal for EcoPulse University,
            Green Campus — NAAC Green Audit compliance & campus-wide Net-Zero operational tracking.
          </span>
        </div>

        <div className="footer-links-group">
          <h4>Admin Navigation</h4>
          <div className="footer-nav-list">
            <Link to="/">Campus Overview</Link>
            <Link to="/audit">Institutional Audit</Link>
            <Link to="/dashboard">Power BI Dashboard</Link>
            <Link to="/predictions">AI Prediction Studio</Link>
            <Link to="/settings">Campus Settings & Compliance</Link>
            <Link to="/about">About EcoPulse</Link>
            <Link to="/team">Meet the Team</Link>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "inherit",
                  cursor: "pointer",
                  textAlign: "left",
                  font: "inherit",
                }}
              >
                Administrator Login
              </button>
            )}
          </div>
        </div>

        <div className="footer-action-group">
          <h4>Compliance & Reports</h4>
          <p className="footer-tagline">
            Export accredited carbon audit statements aligned with ISO 14064,
            NIRF Sustainability, and NAAC Criterion VII parameters.
          </p>
          <div className="footer-compliance-badges">
            <span className="comp-badge">
              <ShieldCheck size={13} /> NAAC 'A' Grade • BEE ESCO
            </span>
            <span className="comp-badge">
              <FileText size={13} /> Green Audit v2.4
            </span>
            <span className="comp-badge">
              <BrainCircuit size={13} /> ML Predictive Engine
            </span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 EcoPulse Institutional Portal. All rights reserved.</p>
        <span>Engineered for University & College Environmental Administration</span>
      </div>
    </footer>
  );
}
