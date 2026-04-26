import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Badge from "../components/UI/Badge";
import Button from "../components/UI/Button";
import Card from "../components/UI/Card";
import { fetchPublicPaymentCheckout, respondToPublicPaymentCheckout } from "../services/api";

const statusTone = {
  pending: "secondary",
  paid: "accent",
  failed: "secondary",
  cancelled: "secondary",
};

const PaymentPublicView = () => {
  const { token } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPayment = async () => {
    try {
      const response = await fetchPublicPaymentCheckout(token);
      setPayment(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load this payment link.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [token]);

  const handleRespond = async (status) => {
    setSaving(true);
    setError("");
    try {
      const response = await respondToPublicPaymentCheckout(token, { status });
      setPayment(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update this payment right now.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-bold uppercase tracking-widest text-slate-500">Loading payment...</div>;
  }

  if (error && !payment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md p-8 text-center shadow-xl">
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Payment unavailable</h2>
          <p className="mt-3 text-sm font-medium text-slate-600">{error}</p>
        </Card>
      </div>
    );
  }

  const isPending = payment.status === "pending";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden border-none p-0 shadow-2xl rounded-[40px]">
          <div className="bg-slate-900 px-8 py-10 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Secure Checkout</p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tighter">Complete Your Payment</h1>
            <p className="mt-2 text-sm font-medium text-slate-300">
              Review the amount below and confirm your payment status.
            </p>
          </div>

          <div className="space-y-8 p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusTone[payment.status] || "secondary"}>{payment.status}</Badge>
              <Badge variant="secondary">{payment.provider}</Badge>
              {payment.bookingId?.packageTour && <Badge variant="secondary">{payment.bookingId.packageTour}</Badge>}
            </div>

            <div className="rounded-[32px] bg-slate-50 p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Amount due</p>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl font-black text-slate-900">{payment.currency}</span>
                <span className="text-5xl font-black tracking-tighter text-slate-900">{Number(payment.amount || 0).toLocaleString()}</span>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">
                {payment.customerName || payment.bookingId?.name || "Traveler"}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {payment.paymentSummary?.summary}
              </p>
            </div>

            {payment.notes && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Payment notes</p>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{payment.notes}</p>
              </div>
            )}

            {error && (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            {isPending ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Button onClick={() => handleRespond("paid")} disabled={saving} className="py-4 text-sm">
                  {saving ? "Saving..." : "I Paid"}
                </Button>
                <Button variant="secondary" onClick={() => handleRespond("failed")} disabled={saving} className="py-4 text-sm">
                  Payment Failed
                </Button>
                <Button variant="outline" onClick={() => handleRespond("cancelled")} disabled={saving} className="py-4 text-sm">
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 text-center">
                <p className="text-sm font-bold text-slate-700">
                  This payment is already marked as <span className="uppercase">{payment.status}</span>.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPublicView;
