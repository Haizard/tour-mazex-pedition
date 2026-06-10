import { useEffect, useState } from "react";
import {
  FaChartBar, FaDollarSign, FaPercent, FaReceipt, FaExchangeAlt,
} from "react-icons/fa";
import { fetchCommissionReport } from "../../services/api";

const CommissionDashboard = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchCommissionReport();
        setReport(response.data);
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
          "Unable to load commission report."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-100" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
        {error}
      </div>
    );
  }

  if (!report?.configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm font-bold text-amber-700">
        Commission report is not available. PostgreSQL revenue tracking must be configured.
      </div>
    );
  }

  const summary = report.summary || {};
  const properties = report.byProperty || [];
  const transactions = report.recentTransactions || [];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">
          Revenue Report
        </p>
        <h2 className="mt-2 flex items-center gap-3 text-2xl font-black tracking-tight text-zinc-950">
          <FaChartBar className="text-emerald-600" /> Commission Report
        </h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-zinc-600">
          Revenue from property partnerships on bookings originating from your site.
        </p>
        {report.generatedAt && (
          <p className="mt-2 text-xs font-bold text-zinc-400">
            Snapshot {new Date(report.generatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-600 p-2.5 text-white">
              <FaDollarSign className="text-lg" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
              Total Commission
            </p>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
            ${Number(summary.totalCommission || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <FaReceipt className="text-lg" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
              Transactions
            </p>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
            {summary.totalTransactions || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-600 p-2.5 text-white">
              <FaPercent className="text-lg" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-700">
              Avg Commission
            </p>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
            ${Number(summary.avgCommission || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-600 p-2.5 text-white">
              <FaExchangeAlt className="text-lg" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
              Partnered Properties
            </p>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
            {summary.partneredProperties || 0}
          </p>
        </div>
      </div>

      {/* Breakdown by property */}
      {properties.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-zinc-950">
            Commission by Property
          </h3>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            Earnings broken down by individual partnered properties.
          </p>

          <div className="mt-4 space-y-3">
            {properties.map((prop, index) => (
              <div
                key={`${prop.propertyName}-${prop.checkoutKind}-${index}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-zinc-900">
                      {prop.propertyName}
                    </p>
                    <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-600">
                      {prop.checkoutKind === "hotel-stay" ? "Hotel" : prop.checkoutKind === "restaurant_reservation" ? "Restaurant" : prop.checkoutKind || "Property"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-zinc-500">
                    {prop.transactionCount} transactions · avg {Number(prop.avgCommissionPercent).toFixed(1)}% commission
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-zinc-900">
                    ${Number(prop.totalCommission).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs font-bold text-zinc-400">
                    ${Number(prop.avgCommissionPerTxn).toFixed(2)} / txn
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Commission Transactions */}
      {transactions.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-zinc-950">
            Recent Commission Transactions
          </h3>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            The most recent bookings that earned commission through partnerships.
          </p>

          <div className="mt-4 space-y-3">
            {transactions.map((txn) => (
              <div
                key={txn.sourceId}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-100 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-zinc-900">
                      {txn.propertyName}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ${
                        txn.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : txn.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-zinc-500">
                    {txn.customerName || "Guest"} ·{" "}
                    {txn.updatedAt
                      ? new Date(txn.updatedAt).toLocaleDateString()
                      : "Date unknown"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-right">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                      Payment
                    </p>
                    <p className="text-sm font-black text-zinc-900">
                      {txn.currency} {Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">
                      Commission
                    </p>
                    <p className="text-sm font-black text-emerald-700">
                      ${Number(txn.payoutAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {transactions.length === 0 && properties.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <FaDollarSign className="mx-auto text-4xl text-zinc-300" />
          <p className="mt-4 text-lg font-black text-zinc-900">
            No commission data yet
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-500">
            Commission from property partnerships will appear here once bookings start flowing through your partnered properties.
          </p>
        </div>
      )}
    </section>
  );
};

export default CommissionDashboard;
