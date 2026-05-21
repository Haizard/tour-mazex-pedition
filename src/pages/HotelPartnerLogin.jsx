import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginHotelPartnerAdmin } from "../services/api";

const HotelPartnerLogin = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || "/hotel-partner";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await loginHotelPartnerAdmin(credentials);
      window.localStorage.setItem("hotelPartnerAuthToken", response.data.token || "");
      navigate(redirectPath, { replace: true });
    } catch (loginError) {
      setError(loginError.response?.data?.message || "Invalid hotel partner credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
        <section className="flex-1">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
            Hotel Partner Portal
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-5xl">
            Manage your hotel profile
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-slate-300">
            Sign in as a hotel partner to update your assigned hotel details while marketplace
            publishing stays with the tourism operator.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
              {error}
            </div>
          )}
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
            Username
          </label>
          <input
            name="username"
            value={credentials.username}
            onChange={(event) => setCredentials({ ...credentials, username: event.target.value })}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white outline-none focus:border-primary"
            required
          />
          <label className="mt-5 block text-xs font-black uppercase tracking-widest text-slate-400">
            Password
          </label>
          <input
            name="password"
            type="password"
            value={credentials.password}
            onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white outline-none focus:border-primary"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Enter hotel portal"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default HotelPartnerLogin;
