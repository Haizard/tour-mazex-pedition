import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlatformAdminAuth } from "../context/PlatformAdminAuthContext";

const PlatformAdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = usePlatformAdminAuth();

  const redirectPath = location.state?.from?.pathname || "/platform";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleChange = (event) => {
    setError("");
    setCredentials((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await login(credentials);
      navigate(redirectPath, { replace: true });
    } catch (loginError) {
      setError(loginError.response?.data?.message || "Invalid platform credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden p-16 items-end">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.28),_transparent_42%),linear-gradient(135deg,_#020617,_#0f172a_55%,_#164e63)]" />
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative z-10 max-w-lg">
          <p className="text-cyan-300 font-black uppercase tracking-[0.3em] text-xs mb-4">
            SaaS Control Plane
          </p>
          <h1 className="text-5xl font-black uppercase tracking-tight leading-none mb-5">
            Platform
            <br />
            <span className="text-cyan-300">Operations</span>
          </h1>
          <p className="text-slate-300 font-medium leading-relaxed">
            Monitor tenants, admin coverage, and future inbox integrations from
            the shared platform layer.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-20">
        <div className="w-full max-w-md space-y-8">
          <div>
            <p className="text-cyan-300 font-black uppercase tracking-widest text-xs mb-2">
              Platform Admin
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tight">
              Sign In
            </h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">
              Use your platform credentials to access the tenant operations console.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-2xl text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:border-cyan-400/60 focus:bg-white/10 transition font-medium placeholder:text-slate-600"
                placeholder="platform-admin"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:border-cyan-400/60 focus:bg-white/10 transition font-medium placeholder:text-slate-600"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 font-black py-4 rounded-2xl uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting || loading ? "Authenticating..." : "Open Platform Console"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full border border-white/10 text-slate-300 font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-white/5 transition"
          >
            Switch To Tenant Admin
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full text-center text-sm text-slate-500 hover:text-cyan-300 transition font-bold"
          >
            {"<- Return to Main Site"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformAdminLogin;
