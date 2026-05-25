import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaClipboardCheck, FaDoorOpen, FaStore, FaUtensils } from "react-icons/fa";
import { fetchRestaurantPartnerSession } from "../services/api";

const normalizePartnerSession = (payload = {}) => {
  const partnerAdmin = payload?.partnerAdmin || payload?.user || payload || {};
  const tenant = payload?.tenant || null;

  return {
    partnerAdmin,
    tenant,
  };
};

const getAssignedRestaurants = (session = {}) =>
  Array.isArray(session?.partnerAdmin?.restaurantIds)
    ? session.partnerAdmin.restaurantIds.map((restaurantId) => ({
        id: String(restaurantId),
        name: `Restaurant ${String(restaurantId).slice(0, 8)}`,
        summary: "Full restaurant partner tools will appear here in the next rollout.",
      }))
    : [];

const RestaurantPartnerDashboard = () => {
  const [session, setSession] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const sessionResponse = await fetchRestaurantPartnerSession();

        if (!active) {
          return;
        }

        const normalizedSession = normalizePartnerSession(sessionResponse.data || {});
        setSession(normalizedSession);
        setRestaurants(getAssignedRestaurants(normalizedSession));
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError.response?.data?.message ||
            "Unable to load the restaurant partner workspace."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const sessionLabel = useMemo(
    () =>
      session?.partnerAdmin?.displayName ||
      session?.partnerAdmin?.name ||
      session?.partnerAdmin?.username ||
      session?.partnerAdmin?.email ||
      "Restaurant partner",
    [session]
  );

  const signOut = () => {
    window.localStorage.removeItem("restaurantPartnerAuthToken");
    navigate("/restaurant-partner/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-[#dccfb7] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8b7451]">
              Restaurant Partner Portal
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Assigned restaurant profiles
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              This first phase confirms your session and assigned listing context.
              Reservations, payments, and service tools come next.
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700"
          >
            <FaDoorOpen />
            Sign out
          </button>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
              <div className="h-3 w-44 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-5 h-10 w-2/3 animate-pulse rounded-2xl bg-slate-100" />
              <div className="mt-5 h-32 w-full animate-pulse rounded-3xl bg-slate-100" />
            </div>
            <div className="rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
              <div className="h-3 w-36 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-5 h-40 w-full animate-pulse rounded-3xl bg-slate-100" />
            </div>
          </div>
        ) : (
          <>
            {error ? (
              <div className="mt-8 rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                  Session confirmed
                </p>
                <h2 className="mt-3 flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950">
                  <FaUtensils className="text-[#234232]" />
                  {sessionLabel}
                </h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-[#f6f1e8] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Username
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {session?.partnerAdmin?.username || "Assigned after approval"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f6f1e8] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Contact
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {session?.tenant?.name || "Available from your approved tenant profile"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                  Next in rollout
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    "Reservation workflow controls",
                    "Menu and service updates for review",
                    "Payments and dining operations reporting",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl bg-[#f6f1e8] p-4"
                    >
                      <FaClipboardCheck className="mt-1 text-[#234232]" />
                      <p className="text-sm font-semibold text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-8 rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                    Assigned listings
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    Restaurant context
                  </h2>
                </div>
                <p className="text-sm font-semibold text-slate-500">
                  {restaurants.length} assigned restaurant
                  {restaurants.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant._id || restaurant.id || restaurant.slug || restaurant.name}
                    className="rounded-3xl border border-[#e8ddca] bg-[#fcfaf6] p-5"
                  >
                    <p className="text-lg font-black tracking-tight text-slate-950">
                      {restaurant.name}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[#8b7451]">
                      {restaurant.destination || "Destination pending"}
                    </p>
                    <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                      {restaurant.summary ||
                        "This assigned listing is ready for future restaurant partner tools."}
                    </p>
                  </div>
                ))}
              </div>

              {!restaurants.length ? (
                <div className="mt-5 rounded-3xl border border-dashed border-[#dccfb7] bg-[#fcfaf6] p-6 text-sm font-semibold text-slate-600">
                  No assigned restaurants are available in this session yet. Once
                  approved claims are linked, they will appear here.
                </div>
              ) : null}

              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#eef6f0] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#234232]">
                <FaStore />
                Restaurant partner dashboard phase one is active
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default RestaurantPartnerDashboard;
