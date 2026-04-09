import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api.js"; // ← your API URL

// Category colors and icons
const categoryColors = {
  Mod: { color: "#bf5fff", bg: "rgba(191,95,255,0.1)", border: "rgba(191,95,255,0.3)" },
  "Save File": { color: "#00c853", bg: "rgba(0,200,83,0.1)", border: "rgba(0,200,83,0.3)" },
  Patch: { color: "#ffd600", bg: "rgba(255,214,0,0.1)", border: "rgba(255,214,0,0.3)" },
  Tool: { color: "#00f5ff", bg: "rgba(0,245,255,0.1)", border: "rgba(0,245,255,0.3)" },
  Map: { color: "#ff6b35", bg: "rgba(255,107,53,0.1)", border: "rgba(255,107,53,0.3)" },
  Other: { color: "#8899bb", bg: "rgba(136,153,187,0.1)", border: "rgba(136,153,187,0.3)" },
};

const categoryIcons = {
  Mod: "⚙️", "Save File": "💾", Patch: "🔧", Tool: "🛠️", Map: "🗺️", Other: "📁",
};

// Detect download host
function detectHost(url) {
  if (!url) return { icon: "🌐", label: "Download" };
  if (url.includes("drive.google.com")) return { icon: "🟢", label: "Google Drive" };
  if (url.includes("mega.nz")) return { icon: "🔵", label: "MEGA" };
  if (url.includes("mediafire.com")) return { icon: "🟣", label: "MediaFire" };
  if (url.includes("github.com")) return { icon: "⚫", label: "GitHub" };
  if (url.includes("nexusmods.com")) return { icon: "🟠", label: "Nexus Mods" };
  if (url.includes("onedrive") || url.includes("1drv.ms")) return { icon: "🔴", label: "OneDrive" };
  if (url.includes("dropbox.com")) return { icon: "🔷", label: "Dropbox" };
  return { icon: "🌐", label: "Download" };
}

// Star rating component
function StarRating({ fileId, avgRating, ratingCount }) {
  const { user, token } = useAuth();
  const [hovered, setHovered] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [currentAvg, setCurrentAvg] = useState(avgRating);
  const [currentCount, setCurrentCount] = useState(ratingCount);

  const handleRate = async (rating) => {
    if (!user) return alert("Please login to rate files.");
    setUserRating(rating);
    try {
      const res = await axios.post(
        `${API_URL}/api/files/${fileId}/rate`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentAvg(res.data.avg_rating);
      setCurrentCount(res.data.rating_count);
    } catch {
      alert("Failed to submit rating.");
    }
  };

  const displayRating = hovered || userRating || currentAvg;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(star)}
            className="text-xl transition-transform hover:scale-125"
            style={{
              color: star <= displayRating ? "#fbbf24" : "var(--text-muted)",
              textShadow: star <= displayRating ? "0 0 8px #fbbf24" : "none"
            }}
          >★</button>
        ))}
      </div>
      <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
        {currentAvg > 0 ? `${Number(currentAvg).toFixed(1)} (${currentCount})` : "No ratings"}
      </span>
    </div>
  );
}

// Comment section
function CommentSection({ fileId }) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/files/${fileId}/comments`)
      .then(res => { setComments(res.data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [fileId]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/files/${fileId}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(prev => [res.data, ...prev]);
      setNewComment("");
    } catch { alert("Failed to post comment."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (commentId) => {
    try {
      await axios.delete(`${API_URL}/api/files/${fileId}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch { alert("Failed to delete."); }
  };

  return (
    <div className="flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
      {user ? (
        <div className="flex gap-2">
          <input type="text" className="input-field text-sm py-2"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm py-2 px-3 shrink-0">
            POST
          </button>
        </div>
      ) : (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
          LOGIN TO COMMENT
        </p>
      )}
      {comments.length === 0 ? (
        <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>No comments yet</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2 p-2.5 rounded-lg"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, var(--neon), var(--plasma))", fontFamily: "Rajdhani" }}>
                {c.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani" }}>
                    {c.username}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs mt-0.5 break-words" style={{ color: "var(--text-secondary)" }}>{c.content}</p>
              </div>
              {user?.username === c.username && (
                <button onClick={() => handleDelete(c.id)}
                  className="text-xs shrink-0 transition-colors" style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => e.target.style.color = "#ff6b35"}
                  onMouseLeave={(e) => e.target.style.color = "var(--text-muted)"}
                >✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main FileCard
export default function FileCard({ file }) {
  const catStyle = categoryColors[file.category] || categoryColors["Other"];
  const icon = categoryIcons[file.category] || "📁";
  const [downloads, setDownloads] = useState(Number(file.downloads) || 0);
  const [showComments, setShowComments] = useState(false);
  const host = detectHost(file.download_url);

  // Fallback image logic: Cloudinary → local path → placeholder
  const coverUrl = file.cover_image
    || (file.localPath ? `${process.env.REACT_APP_BACKEND_URL}/${file.localPath}` : "/placeholder.jpg");

  const handleDownloadClick = async () => {
    try { await axios.post(`${API_URL}/api/files/${file.id}/click`); setDownloads(d => d + 1); }
    catch {} // silent fail
    window.open(file.download_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="card card-hover flex flex-col gap-0 group overflow-hidden" style={{ padding: 0 }}>
      {/* Cover Image */}
      <div className="relative w-full overflow-hidden" style={{ height: "176px", background: "var(--bg-secondary)" }}>
        {coverUrl ? (
          <img src={coverUrl} alt={file.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => e.target.src = "/placeholder.jpg"}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, var(--bg-secondary), var(--bg-card))" }}>
            <span className="text-5xl">{icon}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>NO COVER</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="badge" style={{ color: catStyle.color, background: catStyle.bg, borderColor: catStyle.border }}>
            {file.category}
          </span>
        </div>
        {file.download_url && (
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs px-2 py-1 rounded"
              style={{ background: "rgba(0,0,0,0.7)", color: "var(--text-secondary)", fontFamily: "Share Tech Mono" }}>
              {host.icon} {host.label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-5">
        <div>
          <h3 className="font-bold text-base leading-tight transition-colors"
            style={{ fontFamily: "Rajdhani", color: "var(--text-primary)", letterSpacing: "0.02em" }}
            onMouseEnter={(e) => e.target.style.color = "var(--neon)"}
            onMouseLeave={(e) => e.target.style.color = "var(--text-primary)"}
          >{file.title}</h3>
          <p className="text-sm mt-0.5 font-medium" style={{ color: "var(--neon)", opacity: 0.8 }}>{file.game}</p>
        </div>

        {file.description && (
          <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {file.description}
          </p>
        )}

        <StarRating fileId={file.id} avgRating={file.avg_rating} ratingCount={file.rating_count} />

        <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono" }}>
          <span>⬇️ {downloads}</span>
          <span>💬 {file.comment_count || 0}</span>
          <span className="ml-auto flex items-center gap-1">
            <div className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--neon), var(--plasma))" }}>
              {file.uploader_name?.[0]?.toUpperCase()}
            </div>
            {file.uploader_name}
          </span>
        </div>

        <div className="flex gap-2 mt-1">
          <button onClick={handleDownloadClick}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all"
            style={{
              fontFamily: "Rajdhani",
              letterSpacing: "0.05em",
              background: "linear-gradient(135deg, var(--neon), var(--plasma))",
              color: "#fff",
            }}
          >{host.icon} {host.label.toUpperCase()} ↗</button>

          <button onClick={() => setShowComments(!showComments)}
            className="py-2.5 px-3 rounded-lg transition-all text-sm"
            style={{
              border: `1px solid ${showComments ? "var(--neon)" : "var(--border)"}`,
              color: showComments ? "var(--neon)" : "var(--text-muted)",
              background: showComments ? "rgba(0,245,255,0.08)" : "transparent",
            }}
            title="Comments"
          >💬</button>
        </div>

        {showComments && <CommentSection fileId={file.id} />}
      </div>
    </div>
  );
}