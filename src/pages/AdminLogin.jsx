import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (
        credentials.username === "admin" &&
        credentials.password === "admin123"
      ) {
        localStorage.setItem("adminAuth", "true");
        navigate("/admin");
      } else {
        setError("Invalid credentials. Access denied.");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end p-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative z-10 text-white">
          <p className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4">
            Makolo Adventure
          </p>
          <h1 className="text-5xl font-black font-heading uppercase tracking-tighter leading-none mb-4">
            Control
            <br />
            <span className="text-primary italic">Center</span>
          </h1>
          <p className="text-gray-400 font-medium max-w-xs">
            Manage your tours, blogs, and bookings from a single powerful
            platform.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-20">
        <div className="w-full max-w-md space-y-8">
          <div>
            <p className="text-primary font-black uppercase tracking-widest text-xs mb-2">
              Admin Portal
            </p>
            <h2 className="text-3xl font-black text-white font-heading uppercase tracking-tight">
              Sign In
            </h2>
            <p className="text-gray-500 text-sm mt-2 font-medium">
              Enter your credentials to proceed.
            </p>
          </div>

          {error && (
            <div className="bg-accent/10 border border-accent/30 text-accent p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
              <span className="text-lg">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:border-primary/60 focus:bg-white/10 transition font-medium placeholder:text-gray-600"
                placeholder="admin"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:border-primary/60 focus:bg-white/10 transition font-medium placeholder:text-gray-600"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-[#00aeaf] text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:opacity-90 transition shadow-2xl shadow-primary/20 disabled:opacity-50 mt-4"
            >
              {loading ? "Authenticating..." : "Access Dashboard →"}
            </button>
          </form>

          <button
            onClick={() => navigate("/")}
            className="w-full text-center text-sm text-gray-600 hover:text-primary transition font-bold"
          >
            ← Return to Main Site
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
