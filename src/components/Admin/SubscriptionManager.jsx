import React from "react";
import { Link } from "react-router-dom";
import { FEATURE_PLAN_REQUIREMENTS, PRICING_PLANS, getPricingPlan } from "../../constants/pricingPlans";
import { useTenant } from "../../context/TenantContext";
import { updateTenantDomainRequest } from "../../services/api";

const featureCards = [
  {
    key: "social-accounts",
    label: "Channels",
    description: "Connect each tenant's Meta and WhatsApp business accounts separately.",
  },
  {
    key: "social-posts",
    label: "Social Posts",
    description: "Create, schedule, and publish live content from the tenant workspace.",
  },
  {
    key: "lead-inbox",
    label: "Lead Inbox",
    description: "Track qualified leads and move them toward real safari bookings.",
  },
  {
    key: "repurposing",
    label: "Repurposing",
    description: "Turn blog content into channel-ready social and campaign assets.",
  },
  {
    key: "campaigns",
    label: "Campaigns",
    description: "Run automated seasonal, migration, and destination campaigns.",
  },
  {
    key: "whatsapp-automation",
    label: "WhatsApp Automation",
    description: "Send structured business follow-ups through tenant-owned WhatsApp channels.",
  },
];

const SubscriptionManager = () => {
  const { tenant, refreshTenant } = useTenant();
  const currentPlan = getPricingPlan(tenant?.subscription?.plan);
  const subscriptionStatus = tenant?.subscription?.status || "inactive";
  const [requestedDomains, setRequestedDomains] = React.useState(
    (tenant?.requestedCustomDomains || []).join("\n")
  );
  const [savingRequest, setSavingRequest] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setRequestedDomains((tenant?.requestedCustomDomains || []).join("\n"));
  }, [tenant?.requestedCustomDomains]);

  const handleDomainRequestSubmit = async (event) => {
    event.preventDefault();
    setSavingRequest(true);
    setNotice("");
    setError("");

    try {
      await updateTenantDomainRequest({
        requestedCustomDomains: requestedDomains
          .split("\n")
          .map((domain) => domain.trim())
          .filter(Boolean),
      });
      await refreshTenant();
      setNotice("Custom domain request sent to the super admin for approval.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We could not save the domain request right now."
      );
    } finally {
      setSavingRequest(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-[32px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-lime-700 px-8 py-10 text-white shadow-2xl">
        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-emerald-100">
          Subscription Access
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase tracking-tight">
          Keep Premium Tools Public, But Plan-Controlled
        </h2>
        <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-emerald-50/90">
          Your tenants can see the full product surface inside the admin panel, but access is
          unlocked based on their subscription. Right now this workspace is on the{" "}
          <span className="font-black">{currentPlan.name}</span> plan with a status of{" "}
          <span className="font-black uppercase">{subscriptionStatus}</span>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/pricing"
            className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-emerald-900"
          >
            View Public Pricing
          </Link>
          <div className="rounded-full border border-white/30 px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-white">
            Manual plan assignment enabled in super admin
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Domain Service
          </p>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
            Managed Demo And Custom Domains
          </h3>
          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] bg-slate-900 p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-emerald-300">
                Demo Domain
              </p>
              <p className="mt-3 text-lg font-black">{tenant?.demoDomain || "No demo domain yet"}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-500">
                Annual Renewal And Hosting
              </p>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                Your domain and hosting service is managed by the super admin. Annual pricing is
                set between <span className="font-black">$50</span> and <span className="font-black">$200</span>,
                depending on the customer setup and service level.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-black uppercase tracking-widest">
                <span className="rounded-full bg-emerald-100 px-3 py-2 text-emerald-700">
                  {tenant?.domainService?.serviceStatus || "active"}
                </span>
                <span className="rounded-full bg-slate-900 px-3 py-2 text-white">
                  ${tenant?.domainService?.annualPriceUsd || 50} / year
                </span>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleDomainRequestSubmit}
          className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Custom Domain Request
          </p>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
            Submit Domains For Super Admin Approval
          </h3>
          <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
            Add one custom domain per line. The super admin controls DNS setup, activation, annual
            renewal, and hosting pricing before the domain goes live.
          </p>

          {notice && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {notice}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <textarea
            rows={6}
            value={requestedDomains}
            onChange={(event) => setRequestedDomains(event.target.value)}
            placeholder="example.com&#10;www.example.com"
            className="mt-5 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500"
          />

          <div className="mt-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              Pending Requests
            </p>
            {(tenant?.requestedCustomDomains || []).length > 0 ? (
              (tenant.requestedCustomDomains || []).map((domain) => (
                <div key={domain} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
                  {domain}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm font-medium text-slate-500">
                No custom domain request has been submitted yet.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={savingRequest}
            className="mt-6 w-full rounded-full bg-emerald-700 px-5 py-4 text-xs font-black uppercase tracking-[0.24em] text-white disabled:opacity-60"
          >
            {savingRequest ? "Sending Request..." : "Send Domain Request"}
          </button>
        </form>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.code}
            className={`rounded-[28px] border p-6 ${
              plan.highlighted
                ? "border-emerald-500 bg-emerald-50 shadow-xl"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  {plan.highlighted ? "Most Popular" : "Plan"}
                </p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                  {plan.name}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-slate-900">${plan.priceMonthlyUsd}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">per month</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium leading-6 text-slate-600">{plan.description}</p>
            <div className="mt-5 space-y-2">
              {plan.features.map((feature) => (
                <div key={feature} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
                  {feature}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Feature Access Matrix
          </p>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
            What Unlocks At Each Plan
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => {
            const requiredPlan = getPricingPlan(FEATURE_PLAN_REQUIREMENTS[feature.key]);
            const enabled = Boolean(
              tenant?.access?.[
                feature.key === "social-accounts"
                  ? "socialAccounts"
                  : feature.key === "social-posts"
                    ? "socialPosts"
                    : feature.key === "lead-inbox"
                      ? "leadInbox"
                      : feature.key === "whatsapp-automation"
                        ? "whatsappAutomation"
                        : feature.key
              ]
            );

            return (
              <div key={feature.key} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-lg font-black text-slate-900">{feature.label}</h4>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      enabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {enabled ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                  {feature.description}
                </p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Requires {requiredPlan.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
