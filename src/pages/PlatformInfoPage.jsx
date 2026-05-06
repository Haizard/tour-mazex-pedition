import { Link } from "react-router-dom";
import SEO from "../components/UI/SEO";

/* eslint-disable react/prop-types */

const PAGE_CONTENT = {
  features: {
    eyebrow: "Platform Features",
    title: "Everything tourism operators need to attract, sell, and operate bookings.",
    description:
      "MAZ connects marketplace discovery, AI sales assistance, WhatsApp follow-up, quote generation, payments, itineraries, reviews, and partner commissions in one tourism-first platform.",
    points: ["Marketplace discovery", "Unified inbox", "AI agent recommendations", "Booking and payment automation", "Post-booking traveler portal", "Partner commission workflows"],
  },
  operators: {
    eyebrow: "For Operators",
    title: "Launch a stronger digital sales engine for your tourism business.",
    description:
      "Tour operators can publish packages, manage leads, automate follow-up, generate quotes, collect payments, coordinate operations, and grow through marketplace partners.",
    points: ["Professional tenant website", "Tour and booking CMS", "WhatsApp-first sales workflow", "Invoices and itineraries", "Review and repeat customer campaigns", "Marketplace partner inventory"],
  },
  partners: {
    eyebrow: "For Partners",
    title: "Promote verified tours and grow commission revenue.",
    description:
      "Agencies, hotels, creators, guides, transport providers, and tourism partners can discover sellable inventory and build B2B partnerships with operators.",
    points: ["Commission-ready inventory", "Partner collaboration records", "B2B lead discovery", "Referral growth workflows", "Human-reviewed outreach", "Shared marketplace demand"],
  },
  "how-it-works": {
    eyebrow: "How It Works",
    title: "From traveler discovery to confirmed booking.",
    description:
      "Travelers browse marketplace packages, start an inquiry, receive operator guidance, confirm quotes and payments, then access itineraries and post-booking support.",
    points: ["Discover tours", "Compare operators", "Request a quote", "Chat on WhatsApp", "Pay securely", "Access itinerary and support"],
  },
  security: {
    eyebrow: "Security",
    title: "Built with auditability and controlled automation in mind.",
    description:
      "MAZ keeps sensitive workflows human-reviewable, tracks agent decisions, separates tenant data, and records source attribution for compliant marketplace growth.",
    points: ["Tenant-aware access", "Agent decision audit logs", "Human review guardrails", "Source attribution", "Opt-out ready lead records", "Database-backed business truth"],
  },
};

const PlatformInfoPage = ({ page = "features" }) => {
  const content = PAGE_CONTENT[page] || PAGE_CONTENT.features;

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 pb-20 pt-36 text-slate-950 md:px-10">
      <SEO
        title={`${content.eyebrow} | MAZ Expeditions Platform`}
        description={content.description}
        keywords={["tourism platform", "tour marketplace", content.eyebrow]}
      />
      <section className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-800">
            {content.eyebrow}
          </p>
          <h1 className="mt-5 text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">
            {content.title}
          </h1>
          <p className="mt-6 text-lg font-semibold leading-8 text-slate-600">
            {content.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/discover" className="rounded-full bg-slate-950 px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-white">
              Explore Marketplace
            </Link>
            <Link to="/pricing" className="rounded-full border border-slate-300 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-slate-950">
              See Pricing
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.points.map((point, index) => (
            <article key={point} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-sm font-black text-emerald-800">
                {index + 1}
              </span>
              <h2 className="mt-5 text-lg font-black uppercase tracking-tight">{point}</h2>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default PlatformInfoPage;
