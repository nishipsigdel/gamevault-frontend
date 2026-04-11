import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GameCursor from "./components/GameCursor";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import Admin from "./pages/Admin";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center items-center mt-32">
      <div style={{ color: "var(--neon)", fontFamily: "Rajdhani" }} className="text-xl animate-pulse">
        LOADING...
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.is_admin ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <>
      {/* Custom cursor + background particles */}
      <GameCursor />

      <div className="game-bg min-h-screen flex flex-col" style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
          <Routes>
            <Route path="/"        element={<Home />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/upload"  element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/admin"   element={<AdminRoute><Admin /></AdminRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  );
}
