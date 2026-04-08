import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["Mod", "Save File", "Patch", "Tool", "Map", "Other"];
const CATEGORY_ICONS = {
  Mod: "⚙️", "Save File": "💾", Patch: "🔧", Tool: "🛠️", Map: "🗺️", Other: "📁",
};

const LINK_EXAMPLES = [
  { icon: "🟢", label: "Google Drive", hint: "drive.google.com/..." },
  { icon: "🔵", label: "MEGA", hint: "mega.nz/..." },
  { icon: "🟣", label: "MediaFire", hint: "mediafire.com/..." },
  { icon: "⚫", label: "GitHub", hint: "github.com/..." },
  { icon: "🟠", label: "Nexus Mods", hint: "nexusmods.com/..." },
  { icon: "🔴", label: "OneDrive", hint: "onedrive.live.com/..." },
];

function detectLinkType(url) {
  if (!url) return null;
  if (url.includes("drive.google.com")) return { icon: "🟢", label: "Google Drive" };
  if (url.includes("mega.nz")) return { icon: "🔵", label: "MEGA" };
  if (url.includes("mediafire.com")) return { icon: "🟣", label: "MediaFire" };
  if (url.includes("github.com")) return { icon: "⚫", label: "GitHub" };
  if (url.includes("nexusmods.com")) return { icon: "🟠", label: "Nexus Mods" };
  if (url.includes("onedrive.live.com") || url.includes("1drv.ms")) return { icon: "🔴", label: "OneDrive" };
  if (url.includes("dropbox.com")) return { icon: "🔷", label: "Dropbox" };
  if (url.startsWith("http")) return { icon: "🌐", label: "External Link" };
  return null;
}

export default function Upload() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", game: "", category: "Mod", download_url: "",
  });
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [urlValid, setUrlValid] = useState(null);

  const handleCoverChange = (e) => {
    const selected = e.target.files[0];
    if (selected) { setCover(selected); setCoverPreview(URL.createObjectURL(selected)); }
  };

  const validateUrl = (url) => {
    try { new URL(url); setUrlValid(true); }
    catch { setUrlValid(url.length > 0 ? false : null); }
  };

  const detectedLink = detectLinkType(form.download_url);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.download_url) return setError("Please enter a download link.");
    try { new URL(form.download_url); } catch { return setError("Please enter a valid URL starting with https://"); }
    setError(""); setUploading(true);

    const data = new FormData();
    if (cover) data.append("cover", cover);
    data.append("title", form.title);
    data.append("description", form.description);
    data.append("game", form.game);
    data.append("category", form.category);
    data.append("download_url", form.download_url);

    try {
      await axios.post("http://localhost:5000/api/files/upload", data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="card p-12 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full blur-lg opacity-50" style={{ background: "var(--neon)" }} />
            <div className="relative w-full h-full rounded-full flex items-center justify-center text-4xl"
              style={{ background: "var(--bg-card)", border: "2px solid var(--neon)" }}>✅</div>
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "Rajdhani", color: "var(--neon)" }}>
            LISTED SUCCESSFULLY!
          </h2>
          <p style={{ color: "var(--text-muted)" }}>Your file is now available for the community.</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--neon)" }} />
            REDIRECTING TO BROWSE...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link to="/" className="text-sm flex items-center gap-1 mb-4 transition-colors"
          style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
          ← BACK TO BROWSE
        </Link>
        <h1 className="text-4xl font-bold" style={{ fontFamily: "Rajdhani", color: "var(--text-primary)", letterSpacing: "0.05em" }}>
          LIST A FILE
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Share a download link from Google Drive, MEGA, MediaFire, or any hosting service
        </p>
      </div>

      <div className="card p-6">
        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
            style={{ background: "rgba(255,69,0,0.1)", border: "1px solid rgba(255,69,0,0.3)", color: "#ff6b35" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title & Game */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5"
                style={{ color: "var(--text-muted)", fontFamily: "Rajdhani", letterSpacing: "0.1em" }}>
                TITLE *
              </label>
              <input type="text" className="input-field" placeholder="e.g. Ultra Graphics Mod v2.0"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs mb-1.5"
                style={{ color: "var(--text-muted)", fontFamily: "Rajdhani", letterSpacing: "0.1em" }}>
                GAME *
              </label>
              <input type="text" className="input-field" placeholder="e.g. Elden Ring"
                value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })} required />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs mb-2"
              style={{ color: "var(--text-muted)", fontFamily: "Rajdhani", letterSpacing: "0.1em" }}>
              CATEGORY
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    fontFamily: "Rajdhani",
                    border: `1px solid ${form.category === cat ? "var(--neon)" : "var(--border)"}`,
                    color: form.category === cat ? "var(--neon)" : "var(--text-muted)",
                    background: form.category === cat ? "rgba(0,245,255,0.08)" : "transparent",
                    boxShadow: form.category === cat ? "0 0 10px rgba(0,245,255,0.15)" : "none",
                  }}>
                  <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs mb-1.5"
              style={{ color: "var(--text-muted)", fontFamily: "Rajdhani", letterSpacing: "0.1em" }}>
              DESCRIPTION
            </label>
            <textarea className="input-field resize-none" rows={3}
              placeholder="What does this file do? Any install instructions or requirements?"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Download Link — main feature */}
          <div>
            <label className="block text-xs mb-1.5"
              style={{ color: "var(--neon)", fontFamily: "Rajdhani", letterSpacing: "0.1em", textShadow: "0 0 8px var(--neon)" }}>
              DOWNLOAD LINK *
            </label>

            {/* Supported services hint */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {LINK_EXAMPLES.map((s) => (
                <div key={s.label} className="text-center p-2 rounded-lg text-xs"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div style={{ fontFamily: "Rajdhani", fontSize: "0.65rem" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="relative">
              <input
                type="url"
                className="input-field pr-12"
                placeholder="https://drive.google.com/... or https://mega.nz/..."
                value={form.download_url}
                onChange={(e) => {
                  setForm({ ...form, download_url: e.target.value });
                  validateUrl(e.target.value);
                }}
                required
              />
              {/* Validation indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                {urlValid === true ? "✅" : urlValid === false ? "❌" : ""}
              </div>
            </div>

            {/* Detected link type */}
            {detectedLink && (
              <div className="mt-2 flex items-center gap-2 text-sm"
                style={{ color: "var(--neon)", fontFamily: "Share Tech Mono" }}>
                <span>{detectedLink.icon}</span>
                <span>{detectedLink.label} detected</span>
              </div>
            )}

            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              💡 Make sure your link is set to <strong style={{ color: "var(--text-secondary)" }}>public / anyone with link</strong> before sharing
            </p>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-xs mb-1.5"
              style={{ color: "var(--text-muted)", fontFamily: "Rajdhani", letterSpacing: "0.1em" }}>
              COVER IMAGE <span style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>(OPTIONAL)</span>
            </label>
            <div className="flex gap-4 items-start">
              <div className="w-28 h-20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                {coverPreview
                  ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  : <span className="text-3xl">🖼️</span>
                }
              </div>
              <div className="flex-1">
                <label className="cursor-pointer block rounded-xl p-4 text-center transition-all"
                  style={{ border: "2px dashed var(--border)" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--neon)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                  {cover ? (
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{cover.name}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Click to upload cover</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>JPG, PNG, WEBP — recommended 460×215px</p>
                    </div>
                  )}
                </label>
                {cover && (
                  <button type="button" onClick={() => { setCover(null); setCoverPreview(null); }}
                    className="text-xs mt-2 transition-colors" style={{ color: "#ff6b35" }}>
                    ✕ Remove cover
                  </button>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary py-3 mt-2" disabled={uploading}
            style={{ fontSize: "1rem", letterSpacing: "0.1em" }}>
            {uploading ? "LISTING FILE..." : "⚡ LIST FILE"}
          </button>
        </form>
      </div>
    </div>
  );
}
