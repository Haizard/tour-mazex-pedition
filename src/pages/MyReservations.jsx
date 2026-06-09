import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaCalendarCheck, FaCheckCircle, FaClock, FaExclamationTriangle, FaExternalLinkAlt, FaStar, FaTimes, FaUsers } from "react-icons/fa";
import { fetchTravelerRestaurantReservations } from "../services/api";
import { useTravelerAuth } from "../context/TravelerAuthContext";
import { buildReservationDepositStatus, formatDepositAmount } from "../components/Marketplace/restaurantDepositState";
import TravelerGooglePrompt from "../components/Auth/TravelerGooglePrompt";

const statusTone = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  confirmed: { label: "Confirmed", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  declined: { label: "Declined", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  "needs-clarification": { label: "Needs info", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  cancelled: { label: "Cancelled", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
};

const depositTone = {
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  neutral: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600" },
};

const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const PAYMENT_OUTCOME_MESSAGES = {
  success: {
    title: "Payment completed",
    message: "Your deposit payment was successful. The restaurant will confirm your reservation.",
    icon: FaCheckCircle,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    iconColor: "text-emerald-500",
  },
  failed: {
    title: "Payment failed",
    message: "The payment could not be processed. You can try paying again from the reservation card below.",
    icon: FaExclamationTriangle,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    iconColor: "text-red-500",
  },
  cancelled: {
    title: "Payment cancelled",
    message: "You cancelled the payment. The deposit is still pending — you can pay anytime from the reservation card below.",
    icon: FaExclamationTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    iconColor: "text-amber-500",
  },
};

const MyReservations = () => {
  const { isAuthenticated, traveler, loading: authLoading } = useTravelerAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentOutcome, setPaymentOutcome] = useState(null);
  const processedOutcomeRef = useRef(false);

  const loadReservations = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetchTravelerRestaurantReservations();
      setReservations(response.data?.reservations || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load your reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadReservations();
    }
  }, [isAuthenticated, authLoading]);

  // Handle payment outcome from URL params
  useEffect(() => {
    if (authLoading || processedOutcomeRef.current) return;

    const outcome = searchParams.get("payment");
    if (outcome && PAYMENT_OUTCOME_MESSAGES[outcome]) {
      processedOutcomeRef.current = true;
      setPaymentOutcome(outcome);

      // Clean the URL param after capturing it
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("payment");
      setSearchParams(nextParams, { replace: true });

      // Refresh reservations to reflect the updated payment status
      loadReservations();
    }
  }, [authLoading, searchParams]);

  // Not authenticated — show sign-in prompt
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f6f1e8] px-5 pb-16 pt-32 md:pt-40">
        <div className="mx-auto max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-slate-200" />
            <div className="h-4 w-64 rounded bg-slate-200" />
            <div className="h-32 w-full rounded-3xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f6f1e8] px-5 pb-16 pt-32 md:pt-40">
        <div className="mx-auto max-w-lg">
          <div className="rounded-[36px] border border-[#d8c8ae] bg-white p-8 text-center shadow-[0_24px_80px_rgba(35,66,50,0.12)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef6f0] text-2xl">
              <FaStar className="text-[#234232]" />
            </div>
            <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">
              My Reservations
            </h1>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
              Sign in with Google to view all your restaurant reservations, check deposit statuses, and pay pending deposits in one place.
            </p>
            <div className="mt-6">
              <TravelerGooglePrompt returnTo="/my-reservations" label="Sign in to view reservations" variant="inline" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8] px-5 pb-16 pt-32 md:pt-40">
      <main className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
              Traveler Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              My Reservations
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {traveler?.displayName || traveler?.email?.split("@")[0] || "Traveler"}
            </p>
          </div>
          <button
            onClick={loadReservations}
            disabled={loading}
            className="rounded-2xl border border-[#d8c8ae] bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Payment outcome banner */}
        {paymentOutcome ? (() => {
          const pm = PAYMENT_OUTCOME_MESSAGES[paymentOutcome];
          const Icon = pm.icon;
          return (
            <div className={`mt-6 flex items-start gap-4 rounded-[28px] border ${pm.border} ${pm.bg} p-5`}>
              <div className={`mt-0.5 shrink-0 ${pm.iconColor}`}>
                <Icon />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-black uppercase tracking-[0.08em] ${pm.text}`}>{pm.title}</p>
                <p className={`mt-1 text-sm font-medium leading-5 ${pm.text}`}>{pm.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentOutcome(null)}
                className={`shrink-0 ${pm.text} grid h-7 w-7 place-items-center rounded-full transition hover:bg-white/40`}
                aria-label="Dismiss"
              >
                <FaTimes className="text-[10px]" />
              </button>
            </div>
          );
        })() : null}

        {error ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {loading && reservations.length === 0 ? (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-[28px] border border-[#d8c8ae] bg-white p-6">
                <div className="h-5 w-40 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-64 rounded bg-slate-200" />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="h-10 rounded-2xl bg-slate-100" />
                  <div className="h-10 rounded-2xl bg-slate-100" />
                  <div className="h-10 rounded-2xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && reservations.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-[#d8c8ae] bg-white p-8 text-center">
            <p className="text-sm font-medium text-slate-500">
              No restaurant reservations yet.
            </p>
            <Link
              to="/discover/restaurants"
              className="mt-4 inline-block rounded-2xl bg-[#234232] px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
            >
              Browse restaurants
            </Link>
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          {reservations.map((reservation) => {
            const tone = statusTone[reservation.status] || statusTone.pending;
            const depositStatus = buildReservationDepositStatus({
              reservation,
              payment: reservation.payment || null,
              estimatedDeposit: null,
              checkoutSettings: {},
            });
            const dt = depositTone[depositStatus.tone] || depositTone.neutral;

            return (
              <div
                key={reservation.id || reservation._id}
                className="rounded-[28px] border border-[#d8c8ae] bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/discover/restaurants/${reservation.restaurant?.slug || ""}`}
                        className="text-lg font-black tracking-tight text-slate-950 hover:text-[#234232]"
                      >
                        {reservation.restaurant?.name || "Restaurant"}
                      </Link>
                      <span className={`inline-flex items-center gap-1.5 rounded-full ${tone.bg} px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${tone.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                        {tone.label}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <FaCalendarCheck className="text-[#234232]" />
                        {reservation.date || "Date TBD"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FaClock className="text-[#234232]" />
                        {reservation.preferredTime || "—"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FaUsers className="text-[#234232]" />
                        {reservation.guestCount || "?"} guest{reservation.guestCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {reservation.restaurant?.destination ? (
                      <p className="mt-2 text-xs font-medium text-slate-400">
                        {reservation.restaurant.destination}
                      </p>
                    ) : null}

                    {reservation.travelerNotes || reservation.dietaryNotes ? (
                      <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                        {reservation.travelerNotes || reservation.dietaryNotes || ""}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Deposit status */}
                {depositStatus.stage !== "not_required" && depositStatus.stage !== "estimated" ? (
                  <div className={`mt-4 rounded-2xl border ${dt.border} ${dt.bg} p-4`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-xs font-bold ${dt.text}`}>{depositStatus.label}</p>
                        {depositStatus.amount > 0 ? (
                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {formatDepositAmount(depositStatus.amount, depositStatus.currency)}
                          </p>
                        ) : null}
                      </div>
                      {depositStatus.checkoutUrl ? (
                        <Link
                          to={depositStatus.checkoutUrl}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#234232] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white"
                        >
                          {depositStatus.actionLabel || "Pay now"}
                          <FaExternalLinkAlt className="text-[9px]" />
                        </Link>
                      ) : null}
                    </div>
                    {depositStatus.paymentInstructions ? (
                      <p className="mt-2 text-xs text-slate-500">{depositStatus.paymentInstructions}</p>
                    ) : null}
                  </div>
                ) : null}

                {/* Reservation ID and timestamp */}
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span>#{String(reservation.id || reservation._id || "").slice(-8)}</span>
                  <span>{fmtDate(reservation.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default MyReservations;
