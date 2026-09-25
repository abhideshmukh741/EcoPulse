import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
  Building2, Menu, X, ShieldCheck,
  BrainCircuit, BarChart3, Calculator,
  Settings, Lock, LogOut, Sun, Moon
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Navbar({ adminUser, onToggleAdmin, onOpenAdminModal, onNavClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const toggleMobileMenu = () => setMobileMenuOpen(p => !p);

  // Set slide direction BEFORE React Router navigates
  const handleClick = (to) => {
    if (onNavClick) onNavClick(to, location.pathname);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="logo" onClick={() => handleClick("/")}
        style={{ textDecoration: "none", color: "inherit" }}>
        <div className="logo-icon admin-logo-icon"><Building2 size={20} /></div>
        <span className="logo-brand">EcoPulse</span>
        <span className="logo-separator">•</span>
        <span className="logo-college-pill">MIT Sambhajinagar</span>
      </Link>

      {/* Desktop nav links */}
      <div className="nav-links desktop-nav-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          onClick={() => handleClick("/")}>Overview</NavLink>
        <NavLink to="/audit" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          onClick={() => handleClick("/audit")}>Audit</NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          onClick={() => handleClick("/dashboard")}>Dashboard</NavLink>
        <NavLink to="/predictions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          onClick={() => handleClick("/predictions")}>Predictions</NavLink>
        <NavLink to="/about" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          onClick={() => handleClick("/about")}>About</NavLink>
        <NavLink to="/team" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          onClick={() => handleClick("/team")}>Team</NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          onClick={() => handleClick("/settings")}>Settings</NavLink>
      </div>

      {/* Actions: admin badge + mobile toggle */}
      <div className="nav-actions">
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn" 
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {adminUser ? (
          <div className="admin-status-badge" title="Administrator Session Active">
            <ShieldCheck size={13} />
            <span className="admin-status-text">Admin</span>
            <button type="button" className="admin-logout-mini" onClick={onToggleAdmin}
              title="Sign Out Admin" aria-label="Sign Out">
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button type="button" className="admin-login-nav-btn" onClick={onOpenAdminModal}
            title="Administrator Login">
            <Lock size={14} /> Admin
          </button>
        )}

        <button type="button" className="mobile-menu-toggle" onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <NavLink to="/" end className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}
            onClick={() => handleClick("/")}>Overview</NavLink>
          <NavLink to="/audit" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}
            onClick={() => handleClick("/audit")}><Calculator size={16} /> Campus Audit</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}
            onClick={() => handleClick("/dashboard")}><BarChart3 size={16} /> Power BI Dashboard</NavLink>
          <NavLink to="/predictions" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}
            onClick={() => handleClick("/predictions")}><BrainCircuit size={16} /> AI Predictions</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}
            onClick={() => handleClick("/about")}>About</NavLink>
          <NavLink to="/team" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}
            onClick={() => handleClick("/team")}>Team</NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}
            onClick={() => handleClick("/settings")}><Settings size={16} /> Admin Settings</NavLink>
        </div>
      )}
    </nav>
  );
}
