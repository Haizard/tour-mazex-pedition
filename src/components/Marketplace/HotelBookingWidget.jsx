/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { FaCreditCard, FaHotel } from "react-icons/fa";
import {
  createPublicHotelCheckoutReservation,
  requestPublicHotelCheckoutQuote,
} from "../../services/api";
import {
  buildHotelBookingQuotePayload,
  buildHotelBookingReservationPayload,
  createHotelBookingInitialState,
} from "./hotelBookingState";

const HotelBookingWidget = ({ hotel = {} }) => {
  const [form, setForm] = useState(() => createHotelBookingInitialState());
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingReservation, setLoadingReservation] = useState(false);
  const [status, setStatus] = useState("");
  const [paymentLink, setPaymentLink] = useState("");

  const roomOptions = useMemo(() => hotel.roomInventory || [], [hotel.roomInventory]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus("");
    setPaymentLink("");
  };

  const updateTraveler = (key, value) => {
    setForm((current) => ({
      ...current,
      traveler: {
        ...current.traveler,
        [key]: value,
      },
    }));
    setStatus("");
    setPaymentLink("");
  };

  const loadQuote = async (event) => {
    event.preventDefault();
    setLoadingQuote(true);
    setStatus("");
    try {
      const response = await requestPublicHotelCheckoutQuote(
        hotel.slug,
        buildHotelBookingQuotePayload(form)
      );
      setQuote(response.data?.quote || null);
      setStatus("Quote ready. Review the pricing below before continuing.");
    } catch (error) {
      setQuote(null);
      setStatus(error.response?.data?.message || "We could not price this stay right now.");
    } finally {
      setLoadingQuote(false);
    }
  };

  const reserveStay = async () => {
    setLoadingReservation(true);
    setStatus("");
    try {
      const response = await createPublicHotelCheckoutReservation(
        hotel.slug,
        buildHotelBookingReservationPayload(form)
      );
      const payment = response.data?.payment || null;
      setPaymentLink(payment?.checkoutUrl || "");
      setStatus(
        payment?.checkoutUrl
          ? "Stay reserved. Continue to checkout to pay the current deposit."
          : "Stay request submitted. The operator will confirm next steps."
      );
    } catch (error) {
      setStatus(error.response?.data?.message || "We could not reserve this stay right now.");
    } finally {
      setLoadingReservation(false);
    }
  };

  return (
    <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_24px_80px_rgba(35,66,50,0.12)]">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">Hotel Checkout</p>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
        OTA-style pricing and deposit checkout
      </h2>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
        Price this stay from the published room calendar, then continue to payment without pretending instant confirmation where the hotel has not enabled it.
      </p>

      <form onSubmit={loadQuote} className="mt-5 grid gap-3 md:grid-cols-2">
        <input
          type="date"
          value={form.checkInDate}
          onChange={(event) => updateField("checkInDate", event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium"
          required
        />
        <input
          type="date"
          value={form.checkOutDate}
          onChange={(event) => updateField("checkOutDate", event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium"
          required
        />
        <select
          value={form.roomTypeCode}
          onChange={(event) => updateField("roomTypeCode", event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold"
          required
        >
          <option value="">Select room type</option>
          {roomOptions.map((option) => (
            <option key={option.roomTypeCode} value={option.roomTypeCode}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={form.units}
          onChange={(event) => updateField("units", event.target.value)}
          placeholder="Units"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium"
        />
        <input
          type="number"
          min="1"
          value={form.guestCount}
          onChange={(event) => updateField("guestCount", event.target.value)}
          placeholder="Guests"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium"
        />
        <select
          value={form.provider}
          onChange={(event) => updateField("provider", event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold"
        >
          <option value="stripe">Stripe</option>
          <option value="pesapal">Pesapal</option>
        </select>
        <button
          type="submit"
          disabled={loadingQuote}
          className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#234232] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white disabled:bg-slate-300"
        >
          <FaHotel /> {loadingQuote ? "Pricing..." : "Price This Stay"}
        </button>
      </form>

      {quote ? (
        <div className="mt-6 rounded-[28px] bg-[#f8f5ee] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b7451]">
                {quote.roomTypeLabel} · {quote.nights} night(s)
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {quote.availabilityMode === "instant-bookable"
                  ? "Instant booking enabled"
                  : quote.availabilityMode === "on-request"
                    ? "On-request inventory"
                    : "Operator review before final confirmation"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {quote.currency} {Number(quote.pricing?.total || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm font-medium text-slate-600 sm:grid-cols-2">
            <p>Subtotal: {quote.currency} {Number(quote.pricing?.subtotal || 0).toLocaleString()}</p>
            <p>Taxes: {quote.currency} {Number(quote.pricing?.taxes || 0).toLocaleString()}</p>
            <p>Service fee: {quote.currency} {Number(quote.pricing?.serviceFee || 0).toLocaleString()}</p>
            <p>Cleaning fee: {quote.currency} {Number(quote.pricing?.cleaningFee || 0).toLocaleString()}</p>
            <p className="sm:col-span-2 font-black text-slate-900">
              Deposit due now: {quote.currency} {Number(quote.pricing?.depositDue || 0).toLocaleString()}
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {["firstName", "lastName", "email", "phone"].map((key) => (
              <input
                key={key}
                type={key === "email" ? "email" : "text"}
                value={form.traveler[key]}
                onChange={(event) => updateTraveler(key, event.target.value)}
                placeholder={key.replace(/([A-Z])/g, " $1")}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium capitalize"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={reserveStay}
            disabled={loadingReservation}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white disabled:bg-slate-300"
          >
            <FaCreditCard /> {loadingReservation ? "Reserving..." : "Reserve And Continue To Payment"}
          </button>
        </div>
      ) : null}

      {status ? <p className="mt-4 text-sm font-semibold text-slate-600">{status}</p> : null}
      {paymentLink ? (
        <a
          href={paymentLink}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#d8c8ae] bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#234232]"
        >
          Open payment checkout
        </a>
      ) : null}
    </section>
  );
};

export default HotelBookingWidget;
