import { useEffect, useMemo, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  createPaymentTransaction,
  deletePaymentTransaction,
  fetchBookings,
  fetchPaymentTransactions,
  updatePaymentTransaction,
} from "../../services/api";

const initialForm = {
  bookingId: "",
  provider: "stripe",
  amount: "",
  currency: "USD",
  feePercent: "2.9",
  status: "pending",
  notes: "",
};

const statusTone = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const PaymentAutomationManager = () => {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking._id === form.bookingId),
    [bookings, form.bookingId]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [paymentResponse, bookingsResponse] = await Promise.all([
        fetchPaymentTransactions(),
        fetchBookings(),
      ]);

      setPayments(Array.isArray(paymentResponse.data) ? paymentResponse.data : []);
      setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load payment automation right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      bookingId: form.bookingId || null,
      customerName: selectedBooking?.name || "",
      amount: Number(form.amount || selectedBooking?.totalPrice || 0),
      feePercent: Number(form.feePercent || 0),
    };

    try {
      if (editingId) {
        await updatePaymentTransaction(editingId, payload);
      } else {
        await createPaymentTransaction(payload);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this payment transaction.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (payment) => {
    setEditingId(payment._id);
    setForm({
      bookingId: payment.bookingId || "",
      provider: payment.provider || "stripe",
      amount: String(payment.amount || ""),
      currency: payment.currency || "USD",
      feePercent: String(payment.feePercent ?? "2.9"),
      status: payment.status || "pending",
      notes: payment.notes || "",
    });
  };

  const handleDelete = async (paymentId) => {
    setSaving(true);
    setError("");
    try {
      await deletePaymentTransaction(paymentId);
      if (editingId === paymentId) {
        resetForm();
      }
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete this payment transaction.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Revenue Desk
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Payment Automation
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Create Stripe, PayPal, or manual payment flows for bookings and track collection status with transaction fees.
          </p>
        </div>
        <Badge variant="accent">{payments.length} Transactions</Badge>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            {editingId ? "Edit Payment Flow" : "Create Payment Flow"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={form.bookingId}
              onChange={(event) =>
                setForm((current) => {
                  const booking = bookings.find((item) => item._id === event.target.value);
                  return {
                    ...current,
                    bookingId: event.target.value,
                    amount: current.amount || String(booking?.totalPrice || ""),
                  };
                })
              }
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            >
              <option value="">No booking linked</option>
              {bookings.map((booking) => (
                <option key={booking._id} value={booking._id}>
                  {booking.name} - {booking.packageTour || "Custom"}
                </option>
              ))}
            </select>
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={form.provider}
                onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              >
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="manual">Manual</option>
              </select>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="Amount"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.currency}
                onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                placeholder="Currency"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold uppercase text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.feePercent}
                onChange={(event) => setForm((current) => ({ ...current, feePercent: event.target.value }))}
                placeholder="Fee %"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Internal payment notes, bank reference, guest instructions..."
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            />

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Payment" : "Create Payment"}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Payment Transactions
          </h3>

          <div className="space-y-4">
            {loading && <p className="text-sm font-medium text-slate-500">Loading payment transactions...</p>}

            {!loading && payments.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
                No payment transactions created yet.
              </div>
            )}

            {!loading &&
              payments.map((payment) => (
                <div key={payment._id} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-900">
                          {payment.customerName || "Payment"}
                        </p>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone[payment.status] || statusTone.pending}`}>
                          {payment.status}
                        </span>
                        <Badge variant="secondary">{payment.provider}</Badge>
                      </div>
                      <p className="text-sm font-medium leading-6 text-slate-600">
                        {payment.paymentSummary?.summary || "No payment summary available."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{payment.currency} {payment.amount}</Badge>
                        <Badge variant="secondary">Fee {payment.feePercent}%</Badge>
                        {payment.checkoutUrl && <Badge variant="secondary">Checkout Ready</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={() => handleEdit(payment)} className="rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(payment._id)} className="rounded-2xl border border-red-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-red-600">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentAutomationManager;
