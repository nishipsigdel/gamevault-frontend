import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import FileCard from "../components/FileCard";
import ActivityFeed from "../components/ActivityFeed";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";

const CATEGORIES = ["All", "Mod", "Save File", "Patch", "Tool", "Map", "Other"];
const CATEGORY_ICONS = {
  All: "🎮", Mod: "⚙️", "Save File": "💾", Patch: "🔧",
  Tool: "🛠️", Map: "🗺️", Other: "📁",
};

function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

function StatCounter({ value, label, color }) {
  const count = useCountUp(Number(value) || 0);
  return (
    <div className="text-center animate-fade-in-up">
      <div className="text-4xl font-bold" style={{ fontFamily: "Rajdhani", color, textShadow: `0 0 15px ${color}` }}>
        {count}
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
        {label}
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ files: 0, downloads: 0 });
  const [heroVisible, setHeroVisible] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);
  const heroRef = useRef(null);

  const fetchFiles = async () => {
    setLoading(true); setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== "All") params.category = category;
      const res = await axios.get(`${API_URL}/api/files`, { params });
      setFiles(res.data);
      setStats({
        files: res.data.length,
        downloads: res.data.reduce((a, f) => a + (Number(f.downloads) || 0), 0),
      });
    } catch {
      setError("Failed to load files. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, [category]);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await axios.get(`${API_URL}/api/files/${fileId}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      window.URL.revokeObjectURL(url);
      setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, downloads: f.downloads + 1 } : f));
    } catch { alert("Download failed."); }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div
        ref={heroRef}
        className="relative rounded-2xl overflow-hidden scanline"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          padding: "4rem 2rem",
          textAlign: "center",
          opacity: heroVisible ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        <div className="glow-orb" style={{ width: "300px", height: "300px", background: "var(--neon)", top: "-100px", left: "-100px", animationDelay: "0s" }} />
        <div className="glow-orb" style={{ width: "200px", height: "200px", background: "var(--plasma)", bottom: "-80px", right: "-80px", animationDelay: "3s" }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, var(--neon), var(--plasma), transparent)" }} />

        <div className="relative">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded mb-6 animate-fade-in"
            style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", animationDelay: "0.2s", opacity: 0 }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: "#00ff88", boxShadow: "0 0 6px #00ff88", animation: "glowPulse 1.5s ease-in-out infinite" }} />
            <span style={{ color: "var(--neon)", fontFamily: "Share Tech Mono", fontSize: "0.75rem" }}>
              SYSTEM ONLINE — LIVE FILE SHARING
            </span>
          </div>

          <div className="stagger-children mb-4">
            <h1 className="text-5xl sm:text-7xl font-bold" style={{ fontFamily: "Rajdhani", lineHeight: 1.1, color: "var(--text-primary)" }}>
              SHARE &
            </h1>
            <h1 className="text-5xl sm:text-7xl font-bold animate-neon-flicker" style={{ fontFamily: "Rajdhani", lineHeight: 1.1, color: "var(--neon)" }}>
              DOWNLOAD
            </h1>
            <h1 className="text-5xl sm:text-7xl font-bold" style={{ fontFamily: "Rajdhani", lineHeight: 1.1, color: "var(--plasma)", textShadow: "0 0 30px var(--plasma)" }}>
              GAME FILES
            </h1>
          </div>

          <p className="text-lg max-w-xl mx-auto mb-10 animate-fade-in"
            style={{ color: "var(--text-secondary)", animationDelay: "0.6s", opacity: 0 }}>
            Mods, save files, patches, tools — everything the gaming community needs.
          </p>

          <div className="flex items-center justify-center gap-12 mb-10">
            <StatCounter value={stats.files} label="FILES SHARED" color="var(--neon)" />
            <div style={{ width: "1px", height: "40px", background: "var(--border)" }} />
            <StatCounter value={stats.downloads} label="DOWNLOADS" color="var(--plasma)" />
            <div style={{ width: "1px", height: "40px", background: "var(--border)" }} />
            <div className="text-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="text-4xl font-bold" style={{ fontFamily: "Rajdhani", color: "#fbbf24", textShadow: "0 0 15px #fbbf24" }}>
                ★ 5.0
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
                COMMUNITY
              </div>
            </div>
          </div>

          {!user && (
            <div className="flex items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: "0.8s", opacity: 0 }}>
              <Link to="/register" className="btn-primary px-8 py-3 animate-glow-pulse" style={{ fontSize: "1rem" }}>
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
      <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <ActivityFeed />
      </div>

      {/* ── Search bar — opacity fixed, always visible ── */}
      <form
        onSubmit={(e) => { e.preventDefault(); fetchFiles(); }}
        className="flex gap-2"
        style={{
          opacity: 1,
          animation: "fadeInUp 0.5s ease 0.4s both",
        }}
      >
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>🔍</span>
          <input
            type="text"
            className="input-field pl-11 py-3"
            placeholder="Search by title or game name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <button
          type="submit"
          className="btn-primary px-6 py-3"
          style={{
            transition: "all 0.2s ease",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(0,245,255,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "";
          }}
        >
          SEARCH
        </button>
      </form>

      {/* ── Category Filter — with hover animations ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const isActive  = category === cat;
          const isHovered = hoveredCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              onMouseEnter={() => setHoveredCat(cat)}
              onMouseLeave={() => setHoveredCat(null)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm whitespace-nowrap"
              style={{
                fontFamily: "Rajdhani",
                fontWeight: 700,
                letterSpacing: "0.05em",
                border: `1px solid ${isActive ? "var(--neon)" : isHovered ? "rgba(0,245,255,0.5)" : "var(--border)"}`,
                color: isActive ? "var(--neon)" : isHovered ? "rgba(0,245,255,0.8)" : "var(--text-muted)",
                background: isActive
                  ? "rgba(0,245,255,0.08)"
                  : isHovered
                  ? "rgba(0,245,255,0.04)"
                  : "transparent",
                boxShadow: isActive
                  ? "0 0 15px rgba(0,245,255,0.25), inset 0 0 10px rgba(0,245,255,0.05)"
                  : isHovered
                  ? "0 0 10px rgba(0,245,255,0.15)"
                  : "none",
                transform: isActive ? "translateY(-2px)" : isHovered ? "translateY(-1px)" : "none",
                transition: "all 0.18s ease",
                cursor: "pointer",
              }}
            >
              <span style={{
                display: "inline-block",
                transform: isHovered || isActive ? "scale(1.2) rotate(-5deg)" : "scale(1)",
                transition: "transform 0.18s ease",
              }}>
                {CATEGORY_ICONS[cat]}
              </span>
              {cat.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Results header */}
      {!loading && !error && (
        <div className="flex items-center justify-between animate-fade-in">
          <h2 style={{ fontFamily: "Rajdhani", fontSize: "1.25rem", color: "var(--text-primary)" }}>
            {category === "All" ? "ALL FILES" : category.toUpperCase()}
            <span className="ml-2 text-sm" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
              [{files.length} results]
            </span>
          </h2>
          {user && <Link to="/upload" className="btn-primary text-sm py-2">+ UPLOAD</Link>}
        </div>
      )}

      {/* File Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse" style={{ height: "320px", animationDelay: `${i * 0.1}s` }}>
              <div style={{ height: "176px", background: "var(--bg-secondary)", borderRadius: "12px 12px 0 0" }} />
              <div className="p-5">
                <div className="h-4 rounded mb-2" style={{ background: "var(--bg-secondary)", width: "75%" }} />
                <div className="h-3 rounded mb-4" style={{ background: "var(--bg-secondary)", width: "50%" }} />
                <div className="h-3 rounded" style={{ background: "var(--bg-secondary)", width: "90%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 animate-scale-in">
          <div className="text-5xl mb-4 animate-float">⚠️</div>
          <p style={{ color: "#ff6b35" }}>{error}</p>
          <button onClick={fetchFiles} className="btn-secondary mt-4 text-sm">TRY AGAIN</button>
        </div>
      ) : files.length === 0 ? (
        <div className="card text-center py-20 animate-scale-in">
          <div className="text-6xl mb-4 animate-float">🎮</div>
          <h3 style={{ fontFamily: "Rajdhani", fontSize: "1.5rem", color: "var(--text-primary)" }}>NO FILES FOUND</h3>
          <p className="mt-2 mb-6" style={{ color: "var(--text-muted)" }}>
            {search ? `No results for "${search}"` : "Be the first to upload!"}
          </p>
          {user && <Link to="/upload" className="btn-primary inline-block px-8">UPLOAD FIRST FILE</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 card-grid">
          {files.map((file) => (
            <FileCard key={file.id} file={file} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  );
}