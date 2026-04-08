import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import FileCard from "../components/FileCard";
import ActivityFeed from "../components/ActivityFeed";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["All", "Mod", "Save File", "Patch", "Tool", "Map", "Other"];
const CATEGORY_ICONS = { All: "🎮", Mod: "⚙️", "Save File": "💾", Patch: "🔧", Tool: "🛠️", Map: "🗺️", Other: "📁" };

export default function Home() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ files: 0, downloads: 0 });

  const fetchFiles = async () => {
    setLoading(true); setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== "All") params.category = category;
      const res = await axios.get("http://localhost:5000/api/files", { params });
      setFiles(res.data);
      setStats({ files: res.data.length, downloads: res.data.reduce((a, f) => a + f.downloads, 0) });
    } catch {
      setError("Failed to load files. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, [category]);

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/files/${fileId}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      window.URL.revokeObjectURL(url);
      setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, downloads: f.downloads + 1 } : f));
    } catch {
      alert("Download failed.");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden scanline"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "3rem 2rem", textAlign: "center" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.08) 0%, transparent 70%)" }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, var(--neon), var(--plasma), transparent)" }} />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded mb-6"
            style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00ff88" }} />
            <span style={{ color: "var(--neon)", fontFamily: "Share Tech Mono", fontSize: "0.75rem" }}>
              SYSTEM ONLINE — LIVE FILE SHARING
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold mb-4" style={{ fontFamily: "Rajdhani", lineHeight: 1.1 }}>
            <span style={{ color: "var(--text-primary)" }}>SHARE &</span>
            <br />
            <span style={{ color: "var(--neon)", textShadow: "0 0 30px var(--neon)" }}>DOWNLOAD</span>
            <br />
            <span style={{ color: "var(--plasma)", textShadow: "0 0 30px var(--plasma)" }}>GAME FILES</span>
          </h1>

          <p className="text-lg max-w-xl mx-auto mb-8" style={{ color: "var(--text-secondary)" }}>
            Mods, save files, patches, tools — everything the gaming community needs.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mb-8">
            {[
              { label: "FILES", value: stats.files, color: "var(--neon)" },
              { label: "DOWNLOADS", value: stats.downloads, color: "var(--plasma)" },
              { label: "RATING", value: "5.0★", color: "#fbbf24" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold" style={{ fontFamily: "Rajdhani", color: s.color, textShadow: `0 0 10px ${s.color}` }}>
                  {s.value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {!user && (
            <div className="flex items-center justify-center gap-3">
              <Link to="/register" className="btn-primary px-8 py-3" style={{ fontSize: "1rem" }}>
                🚀 GET STARTED
              </Link>
              <Link to="/login" className="btn-secondary px-8 py-3" style={{ fontSize: "1rem" }}>
                LOGIN
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed />

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); fetchFiles(); }} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>🔍</span>
          <input type="text" className="input-field pl-11 py-3"
            placeholder="Search by title or game name..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary px-6 py-3">SEARCH</button>
      </form>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all"
            style={{
              fontFamily: "Rajdhani",
              fontWeight: 700,
              letterSpacing: "0.05em",
              border: `1px solid ${category === cat ? "var(--neon)" : "var(--border)"}`,
              color: category === cat ? "var(--neon)" : "var(--text-muted)",
              background: category === cat ? "rgba(0,245,255,0.08)" : "transparent",
              boxShadow: category === cat ? "0 0 12px rgba(0,245,255,0.15)" : "none",
            }}
          >
            <span>{CATEGORY_ICONS[cat]}</span> {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Results header */}
      {!loading && !error && (
        <div className="flex items-center justify-between">
          <h2 style={{ fontFamily: "Rajdhani", fontSize: "1.25rem", color: "var(--text-primary)" }}>
            {category === "All" ? "ALL FILES" : category.toUpperCase()}
            <span className="ml-2 text-sm" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
              [{files.length} results]
            </span>
          </h2>
          {user && <Link to="/upload" className="btn-primary text-sm py-2">+ UPLOAD</Link>}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse" style={{ height: "280px" }}>
              <div className="h-40 rounded-lg mb-4" style={{ background: "var(--bg-secondary)" }} />
              <div className="h-4 rounded mb-2" style={{ background: "var(--bg-secondary)", width: "75%" }} />
              <div className="h-3 rounded" style={{ background: "var(--bg-secondary)", width: "50%" }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">⚠️</div>
          <p style={{ color: "#ff6b35" }}>{error}</p>
          <button onClick={fetchFiles} className="btn-secondary mt-4 text-sm">TRY AGAIN</button>
        </div>
      ) : files.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-6xl mb-4">🎮</div>
          <h3 style={{ fontFamily: "Rajdhani", fontSize: "1.5rem", color: "var(--text-primary)" }}>NO FILES FOUND</h3>
          <p className="mt-2 mb-6" style={{ color: "var(--text-muted)" }}>
            {search ? `No results for "${search}"` : "Be the first to upload!"}
          </p>
          {user && <Link to="/upload" className="btn-primary inline-block px-8">UPLOAD FIRST FILE</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {files.map((file) => <FileCard key={file.id} file={file} onDownload={handleDownload} />)}
        </div>
      )}
    </div>
  );
}
