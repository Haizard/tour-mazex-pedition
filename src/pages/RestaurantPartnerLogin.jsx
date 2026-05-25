import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUtensils } from "react-icons/fa";
import { loginRestaurantPartnerAdmin } from "../services/api";

const RestaurantPartnerLogin = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || "/restaurant-partner";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await loginRestaurantPartnerAdmin(credentials);
      window.localStorage.setItem(
        "restaurantPartnerAuthToken",
        response.data?.token || ""
      );
      navigate(redirectPath, { replace: true });
    } catch (loginError) {
      setError(
        loginError.response?.data?.message ||
          "Invalid restaurant partner credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#1f2a1f] px-6 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
        <section className="flex-1">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d7c48e]">
            Restaurant Partner Portal
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-5xl">
            Manage your restaurant profile
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-slate-200">
            Sign in as an approved restaurant partner to confirm your workspace
            access today. Reservation, payment, and service operations tools are
            next in the rollout.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-6"
        >
          {error ? (
            <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
              {error}
            </div>
          ) : null}
          <label className="block text-xs font-black uppercase tracking-widest text-slate-300">
            Username
          </label>
          <input
            name="username"
            value={credentials.username}
            onChange={(event) =>
              setCredentials({ ...credentials, username: event.target.value })
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white outline-none focus:border-[#d7c48e]"
            required
          />
          <label className="mt-5 block text-xs font-black uppercase tracking-widest text-slate-300">
            Password
          </label>
          <input
            name="password"
            type="password"
            value={credentials.password}
            onChange={(event) =>
              setCredentials({ ...credentials, password: event.target.value })
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white outline-none focus:border-[#d7c48e]"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7c48e] px-4 py-3 text-sm font-black uppercase tracking-widest text-[#1f2a1f] disabled:opacity-60"
          >
            <FaUtensils />
            {submitting ? "Signing in..." : "Enter restaurant portal"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default RestaurantPartnerLogin;
