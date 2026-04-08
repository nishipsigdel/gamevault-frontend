// This reads from .env in development and from Vercel env vars in production
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default API_URL;
