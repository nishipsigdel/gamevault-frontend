/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        neon: {
          400: "#00f5ff",
          500: "#00d4e8",
          600: "#00b8cc",
        },
        plasma: {
          400: "#bf5fff",
          500: "#a030f0",
          600: "#8020d0",
        },
        fire: {
          400: "#ff6b35",
          500: "#ff4500",
          600: "#cc3700",
        },
      },
      fontFamily: {
        display: ["'Rajdhani'", "sans-serif"],
        body: ["'Exo 2'", "sans-serif"],
        mono: ["'Share Tech Mono'", "monospace"],
      },
      backgroundImage: {
        "grid-dark": "linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)",
        "grid-light": "linear-gradient(rgba(160,48,240,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(160,48,240,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
    },
  },
  plugins: [],
};
