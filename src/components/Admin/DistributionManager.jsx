import { useEffect, useState } from "react";
import { FaCopy, FaExternalLinkAlt } from "react-icons/fa";

import Badge from "../UI/Badge";
import Card from "../UI/Card";
import { fetchDistributionSummary } from "../../services/api";

const DistributionManager = () => {
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedLabel, setCopiedLabel] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchDistributionSummary();
        setDistribution(response.data || null);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load distribution assets right now.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const copyValue = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel(""), 1800);
    } catch (_error) {
      setError("Clipboard access was blocked by the browser.");
    }
  };

  const linkCards = [
    {
      label: "Hosted Social Planner",
      value: distribution?.links?.hostedPlannerUrl || "",
      description: "Share this link from Instagram bios, Facebook ads, TikTok profiles, or campaign landing buttons.",
    },
    {
      label: "Embeddable Planner",
      value: distribution?.links?.embedPlannerUrl || "",
      description: "Use this inside blogs, partner websites, and editorial campaign pages.",
    },
    {
      label: "Partner Referral Link",
      value: distribution?.links?.partnerReferralUrl || "",
      description: "Hand this to partner agencies or affiliates so lead attribution flows back into the CRM.",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Distribution Desk
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Distribution Assets
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Deploy the trip planner beyond the main website using hosted campaign links, embeddable widgets,
            and partner referral paths that preserve source attribution.
          </p>
        </div>
        <Badge variant="accent">Phase 4 Live</Badge>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Hosted Channel Links
          </h3>
          <div className="space-y-4">
            {loading && <p className="text-sm font-medium text-slate-500">Loading distribution links...</p>}
            {!loading &&
              linkCards.map((item) => (
                <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-900">{item.label}</p>
                      <p className="text-sm font-medium leading-6 text-slate-600">{item.description}</p>
                      <p className="break-all rounded-2xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700">
                        {item.value || "Not available yet."}
                      </p>
                    </div>
                    {item.value && (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(item.value, "_blank", "noopener,noreferrer")}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700"
                        >
                          <FaExternalLinkAlt />
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => copyValue(item.label, item.value)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700"
                        >
                          <FaCopy />
                          {copiedLabel === item.label ? "Copied" : "Copy"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Embed Snippet
          </h3>
          {loading ? (
            <p className="text-sm font-medium text-slate-500">Loading embed snippet...</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium leading-6 text-slate-600">
                Drop this iframe into a blog, partner page, or campaign site to capture attributed trip-planning
                leads without forcing a full white-label build first.
              </p>
              <pre className="overflow-x-auto rounded-[28px] bg-slate-950 p-5 text-xs font-medium leading-6 text-emerald-200">
                {distribution?.embedSnippet || "No embed snippet available."}
              </pre>
              {distribution?.embedSnippet && (
                <button
                  type="button"
                  onClick={() => copyValue("Embed Snippet", distribution.embedSnippet)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700"
                >
                  <FaCopy />
                  {copiedLabel === "Embed Snippet" ? "Copied" : "Copy Snippet"}
                </button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DistributionManager;
