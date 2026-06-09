import { useEffect, useState } from "react";
import { FaCheckCircle, FaClock, FaExclamationCircle, FaExternalLinkAlt } from "react-icons/fa";
import { fetchPublicRestaurantReservationCheckout } from "../../services/api";
import { buildReservationDepositStatus, formatDepositAmount } from "./restaurantDepositState";

const statusCard = {
  success: {
    bg: "bg-[#eef6f0]",
    border: "border-[#c3d9c7]",
    icon: <FaCheckCircle className="text-[#234232] text-lg" />,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <FaExclamationCircle className="text-amber-600 text-lg" />,
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <FaExclamationCircle className="text-red-600 text-lg" />,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <FaClock className="text-blue-600 text-lg" />,
  },
  neutral: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: <FaCheckCircle className="text-slate-500 text-lg" />,
  },
};

const RestaurantDepositFlow = ({ restaurantId, reservationId, estimatedDeposit, restaurantCheckout, onReset }) => {
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCheckout = async () => {
    if (!restaurantId || !reservationId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetchPublicRestaurantReservationCheckout(restaurantId, reservationId);
      setCheckout(response.data);
    } catch (requestError) {
      // Fall back to the initial submission data if the checkout endpoint fails
      setCheckout({
        reservation: { paymentStatus: "not_required", paymentAmount: 0, paymentCurrency: "USD" },
        payment: null,
        estimatedDeposit: estimatedDeposit || null,
        checkoutSettings: restaurantCheckout || {},
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckout();
  }, [restaurantId, reservationId]);

  // Build deposit status from checkout data (or fallback to submission data)
  const depositStatus = checkout
    ? buildReservationDepositStatus(checkout)
    : buildReservationDepositStatus({
        reservation: { paymentStatus: "not_required" },
        payment: null,
        estimatedDeposit: estimatedDeposit || null,
        checkoutSettings: restaurantCheckout || {},
      });

  const cardStyle = statusCard[depositStatus.tone] || statusCard.neutral;

  // Show a loading skeleton while checking payment status
  if (loading && !checkout) {
    return (
      <section className="mt-6 rounded-[28px] border border-[#d8c8ae] bg-[#fcfaf6] p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-200" />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-[28px] border border-[#d8c8ae] bg-[#fcfaf6] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
            Reservation Confirmed
          </p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
            {depositStatus.label}
          </h3>
        </div>
        <span className="rounded-full bg-[#eef6f0] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#234232]">
          #{reservationId?.slice(-6) || "..."}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium leading-6 text-slate-600">
        Your reservation request has been received. The restaurant team will review and confirm availability.
      </p>

      {/* Deposit status card */}
      <div className={`mt-4 rounded-2xl border ${cardStyle.border} ${cardStyle.bg} p-4`}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5">{cardStyle.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{depositStatus.message}</p>

            {depositStatus.amount > 0 && (
              <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Amount: <span className="text-slate-800">{formatDepositAmount(depositStatus.amount, depositStatus.currency)}</span>
              </p>
            )}

            {depositStatus.paymentInstructions && (
              <p className="mt-2 text-xs font-medium text-slate-500">
                {depositStatus.paymentInstructions}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pay deposit button */}
      {depositStatus.checkoutUrl && (
        <a
          href={depositStatus.checkoutUrl}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#234232] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
        >
          {depositStatus.actionLabel || "Pay deposit now"}
          <FaExternalLinkAlt className="text-[10px]" />
        </a>
      )}

      {/* Check status again button */}
      <button
        onClick={loadCheckout}
        disabled={loading}
        className="mt-3 w-full rounded-2xl border border-[#d8c8ae] bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 disabled:opacity-60"
      >
        {loading ? "Checking..." : "Check payment status"}
      </button>

      {error ? (
        <p className="mt-3 text-center text-xs font-medium text-red-600">{error}</p>
      ) : null}

      <hr className="my-4 border-[#d8c8ae]" />

      {/* Make another reservation */}
      <button
        onClick={onReset}
        className="w-full text-center text-xs font-bold uppercase tracking-[0.12em] text-[#8b7451]"
      >
        Make another reservation
      </button>
    </section>
  );
};

export default RestaurantDepositFlow;
