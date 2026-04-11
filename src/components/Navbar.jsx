import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); setMenuOpen(false); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", position: "relative", zIndex: 50 }}
      className="sticky top-0 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo with flicker ── */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg blur-sm opacity-30 group-hover:opacity-60 transition-opacity"
                style={{ background: "var(--neon)" }} />
              <span className="relative text-xl">🎮</span>
            </div>
            <div className="flex items-baseline">
              {/* GAME — flickers */}
              <span
                className="text-xl font-bold logo-flicker"
                style={{ fontFamily: "Rajdhani", letterSpacing: "0.15em" }}
              >
                GAME
              </span>
              {/* VAULT — steady but glows */}
              <span
                className="text-xl font-bold"
                style={{
                  fontFamily: "Rajdhani",
                  letterSpacing: "0.15em",
                  color: "var(--text-primary)",
                  textShadow: "0 0 8px rgba(255,255,255,0.2)",
                }}
              >
                VAULT
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/"       active={isActive("/")}>Browse</NavLink>
            {user && <NavLink to="/upload" active={isActive("/upload")}>Upload</NavLink>}
            {user?.is_admin && <NavLink to="/admin" active={isActive("/admin")} admin>⚡ Admin</NavLink>}

            {/* Theme toggle */}
            <button onClick={toggle}
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "1.1rem" }}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg ml-1"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                  <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--neon), var(--plasma))" }}>
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "Rajdhani" }}>
                    {user.username}
                  </span>
                  {user.is_admin && <span className="admin-badge">Admin</span>}
                </div>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary text-sm py-1.5">Login</Link>
                <Link to="/register" className="btn-primary  text-sm py-1.5">Register</Link>
              </>
            )}
          </div>

          {/* ── Mobile controls ── */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggle} className="w-8 h-8 flex items-center justify-center text-lg">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              className="w-9 h-9 flex items-center justify-center rounded-lg"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 flex flex-col gap-2 anim-fade-up"
            style={{ borderTop: "1px solid var(--border)" }}>
            <MobileLink to="/"       onClick={() => setMenuOpen(false)}>Browse</MobileLink>
            {user && <MobileLink to="/upload" onClick={() => setMenuOpen(false)}>Upload</MobileLink>}
            {user?.is_admin && <MobileLink to="/admin" onClick={() => setMenuOpen(false)}>⚡ Admin Panel</MobileLink>}
            {user ? (
              <>
                <div className="px-3 py-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  Logged in as <span style={{ color: "var(--text-primary)" }}>{user.username}</span>
                  {user.is_admin && <span className="admin-badge ml-2">Admin</span>}
                </div>
                <button onClick={handleLogout} className="btn-danger text-left px-3">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary text-center" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary  text-center" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, active, admin, children }) {
  return (
    <Link to={to} className="px-4 py-2 rounded-lg text-sm transition-all"
      style={{
        fontFamily: "Rajdhani", fontWeight: 600, letterSpacing: "0.05em",
        color: active ? "var(--neon)" : admin ? "#ff6b35" : "var(--text-secondary)",
        background: active ? "rgba(0,245,255,0.08)" : "transparent",
        border: active ? "1px solid rgba(0,245,255,0.2)" : "1px solid transparent",
        textShadow: active ? "0 0 8px var(--neon)" : "none",
      }}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick} className="px-4 py-2.5 rounded-lg transition-all"
      style={{ color: "var(--text-secondary)", fontFamily: "Rajdhani", fontWeight: 600 }}>
      {children}
    </Link>
  );
}
