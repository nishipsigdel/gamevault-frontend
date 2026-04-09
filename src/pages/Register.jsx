import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, form);
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColors = ["transparent", "#ff4500", "#fbbf24", "var(--neon)"];
  const strengthLabels = ["", "WEAK", "FAIR", "STRONG"];

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute inset-0 rounded-xl blur-lg opacity-50" style={{ background: "var(--plasma)" }} />
            <div className="relative w-full h-full rounded-xl flex items-center justify-center text-4xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--plasma)" }}>
              🚀
            </div>
          </div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: "Rajdhani", color: "var(--text-primary)", letterSpacing: "0.05em" }}>
            JOIN GAMEVAULT
          </h1>
          <p style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono", fontSize: "0.8rem", marginTop: "0.25rem" }}>
            CREATE YOUR PLAYER PROFILE
          </p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              style={{ background: "rgba(255,69,0,0.1)", border: "1px solid rgba(255,69,0,0.3)", color: "#ff6b35" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)", fontFamily: "Rajdhani", letterSpacing: "0.1em" }}>
                PLAYER TAG
              </label>
              <input type="text" className="input-field" placeholder="CoolGamer99"
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)", fontFamily: "Rajdhani", letterSpacing: "0.1em" }}>
                EMAIL ADDRESS
              </label>
              <input type="email" className="input-field" placeholder="player@gamevault.gg"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs" style={{ color: "var(--text-muted)", fontFamily: "Rajdhani", letterSpacing: "0.1em" }}>
                  PASSWORD
                </label>
                {strength > 0 && (
                  <span className="text-xs" style={{ color: strengthColors[strength], fontFamily: "Share Tech Mono" }}>
                    {strengthLabels[strength]}
                  </span>
                )}
              </div>
              <input type="password" className="input-field" placeholder="min 6 characters"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              {form.password.length > 0 && (
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${(strength / 3) * 100}%`, background: strengthColors[strength] }} />
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary py-3 mt-2" disabled={loading} style={{ fontSize: "1rem" }}>
              {loading ? "CREATING ACCOUNT..." : "🚀 CREATE ACCOUNT"}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: "1px solid var(--border)" }} />
            </div>
            <div className="relative flex justify-center text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="px-3" style={{ background: "var(--bg-card)" }}>HAVE AN ACCOUNT?</span>
            </div>
          </div>

          <Link to="/login" className="btn-secondary w-full text-center py-2.5 block">LOGIN INSTEAD</Link>
        </div>
      </div>
    </div>
  );
}