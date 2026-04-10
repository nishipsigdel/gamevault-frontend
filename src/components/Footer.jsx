export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: "4rem" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Logo side */}
          <div className="flex items-center gap-2.5">
            <div className="text-xl">🎮</div>
            <div>
              <span className="font-bold" style={{ fontFamily: "Rajdhani", color: "var(--neon)", letterSpacing: "0.1em" }}>
                GAME
              </span>
              <span className="font-bold" style={{ fontFamily: "Rajdhani", color: "var(--text-primary)", letterSpacing: "0.1em" }}>
                VAULT
              </span>
            </div>
          </div>

          {/* Made by */}
          <div className="text-center">
            <p style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono", fontSize: "0.75rem" }}>
              DESIGNED & BUILT BY
            </p>
            <p className="text-lg font-bold mt-0.5" style={{ fontFamily: "Rajdhani", letterSpacing: "0.1em" }}>
              <span style={{ color: "var(--neon)", textShadow: "0 0 10px var(--neon)" }}>
                NISHIP
              </span>
              <span style={{ color: "var(--text-primary)" }}> SIGDEL</span>
            </p>
          </div>

          {/* Right side */}
          <div className="text-right">
            <p style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono", fontSize: "0.75rem" }}>
              BUILT WITH
            </p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              React · Node.js · PostgreSQL
            </p>
          </div>

        </div>

        {/* Bottom line */}
        <div className="mt-6 pt-4 text-center" style={{ borderTop: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text-muted)", fontFamily: "Share Tech Mono", fontSize: "0.7rem" }}>
            © {new Date().getFullYear()} GAMEVAULT — ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </footer>
  );
}
