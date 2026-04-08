import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
          {label.toUpperCase()}
        </span>
      </div>
      <div className="text-3xl font-display font-bold" style={{ color, fontFamily: "Rajdhani" }}>
        {value}
      </div>
    </div>
  );
}

export default function Admin() {
  const { token } = useAuth();
  const [tab, setTab] = useState("files");
  const [stats, setStats] = useState(null);
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, f, u] = await Promise.all([
        axios.get("http://localhost:5000/api/admin/stats", { headers }),
        axios.get("http://localhost:5000/api/admin/files", { headers }),
        axios.get("http://localhost:5000/api/admin/users", { headers }),
      ]);
      setStats(s.data);
      setFiles(f.data);
      setUsers(u.data);
    } catch {
      alert("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (id) => {
    if (!confirm("Delete this file permanently?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/files/${id}`, { headers });
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setStats((s) => ({ ...s, files: s.files - 1 }));
    } catch {
      alert("Failed to delete file.");
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user and all their files?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, { headers });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      fetchAll();
    } catch {
      alert("Failed to delete user.");
    }
  };

  const toggleAdmin = async (id) => {
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/admin/users/${id}/toggle-admin`,
        {}, { headers }
      );
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, is_admin: res.data.is_admin } : u)
      );
    } catch {
      alert("Failed to toggle admin.");
    }
  };

  const filteredFiles = files.filter(
    (f) => f.title.toLowerCase().includes(search.toLowerCase()) ||
           f.game.toLowerCase().includes(search.toLowerCase()) ||
           f.uploader_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) => u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold" style={{ color: "var(--neon)", fontFamily: "Rajdhani", textShadow: "0 0 20px var(--neon)" }}>
            ADMIN PANEL
          </h1>
          <p style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono", fontSize: "0.8rem" }}>
            ⚡ SYSTEM CONTROL ACCESS GRANTED
          </p>
        </div>
        <button onClick={fetchAll} className="btn-secondary text-sm">🔄 Refresh</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.users} icon="👥" color="var(--neon)" />
          <StatCard label="Total Files" value={stats.files} icon="📁" color="var(--plasma)" />
          <StatCard label="Downloads" value={stats.downloads} icon="⬇️" color="#ff6b35" />
          <StatCard label="Comments" value={stats.comments} icon="💬" color="#fbbf24" />
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        className="input-field"
        placeholder="Search files or users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {["files", "users"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-6 py-2 rounded-lg text-sm transition-all"
            style={{
              fontFamily: "Rajdhani",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: tab === t ? "var(--neon)" : "var(--text-muted)",
              border: `1px solid ${tab === t ? "var(--neon)" : "var(--border)"}`,
              background: tab === t ? "rgba(0,245,255,0.08)" : "transparent",
              boxShadow: tab === t ? "0 0 12px rgba(0,245,255,0.2)" : "none",
            }}
          >
            {t === "files" ? `📁 Files (${files.length})` : `👥 Users (${users.length})`}
          </button>
        ))}
      </div>

      {/* Files Table */}
      {tab === "files" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Title", "Game", "Category", "Uploader", "Downloads", "Rating", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3"
                      style={{ color: "var(--neon)", fontFamily: "Rajdhani", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10" style={{ color: "var(--text-muted)" }}>Loading...</td></tr>
                ) : filteredFiles.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10" style={{ color: "var(--text-muted)" }}>No files found</td></tr>
                ) : filteredFiles.map((f) => (
                  <tr key={f.id} className="transition-all"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,245,255,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)", maxWidth: "160px" }}>
                      <div className="truncate font-medium">{f.title}</div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{f.game}</td>
                    <td className="px-4 py-3">
                      <span className="badge" style={{ color: "var(--neon)", borderColor: "var(--border)" }}>
                        {f.category}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{f.uploader_name}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)", fontFamily: "Share Tech Mono" }}>
                      {f.downloads}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#fbbf24" }}>
                      {Number(f.avg_rating).toFixed(1)} ★
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteFile(f.id)} className="btn-danger text-xs py-1 px-2">
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Table */}
      {tab === "users" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Username", "Email", "Files", "Role", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3"
                      style={{ color: "var(--neon)", fontFamily: "Rajdhani", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10" style={{ color: "var(--text-muted)" }}>Loading...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10" style={{ color: "var(--text-muted)" }}>No users found</td></tr>
                ) : filteredUsers.map((u) => (
                  <tr key={u.id} className="transition-all"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,245,255,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: "linear-gradient(135deg, var(--neon), var(--plasma))" }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{u.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono", fontSize: "0.8rem" }}>
                      {u.email}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)", fontFamily: "Share Tech Mono" }}>
                      {u.file_count}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_admin
                        ? <span className="admin-badge">Admin</span>
                        : <span className="badge" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>User</span>
                      }
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleAdmin(u.id)}
                          className="text-xs px-2 py-1 rounded transition-all"
                          style={{
                            border: "1px solid var(--border)",
                            color: u.is_admin ? "#ff6b35" : "var(--neon)",
                            fontFamily: "Rajdhani",
                          }}
                          title={u.is_admin ? "Remove admin" : "Make admin"}
                        >
                          {u.is_admin ? "⬇️ Demote" : "⬆️ Promote"}
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="btn-danger text-xs py-1 px-2">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
