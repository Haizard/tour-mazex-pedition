import React from "react";
import { Link } from "react-router-dom";
import { PRICING_PLANS } from "../constants/pricingPlans";

const PricingPage = () => (
  <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.18),_transparent_35%),linear-gradient(180deg,#f7f5ef_0%,#ffffff_100%)] px-6 pb-20 pt-36 md:px-10">
    <div className="mx-auto max-w-7xl space-y-16">
      <div className="max-w-4xl">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-700">
          Pricing
        </p>
        <h1 className="mt-4 text-5xl font-black uppercase tracking-tight text-slate-900 md:text-6xl">
          Get More Safari Bookings, Automatically
        </h1>
        <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-slate-600">
          Turn your website, social media, and WhatsApp into a 24/7 sales machine. The goal is not
          to charge for features. The goal is to help every operator justify the platform with just
          one extra booking.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/contact"
            className="rounded-full bg-[#2f5b3a] px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-emerald-700/20 hover:bg-[#24492f]"
          >
            Start Free Trial
          </Link>
          <Link
            to="/contact"
            className="rounded-full border border-[#ccb98f] bg-white/80 px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-slate-900 hover:border-[#2f5b3a] hover:text-[#2f5b3a]"
          >
            Book a Demo
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <article
            key={plan.code}
            className={`relative overflow-hidden rounded-[32px] border p-8 ${
              plan.highlighted
                ? "border-[#2f5b3a] bg-[linear-gradient(180deg,#224433_0%,#173121_100%)] text-white shadow-2xl shadow-emerald-900/15"
                : "border-[#dccfb7] bg-white text-slate-900 shadow-sm"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute right-5 top-5 rounded-full bg-[#e0b85c] px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#173121]">
                Most Popular
              </div>
            )}
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${plan.highlighted ? "text-emerald-300" : "text-slate-500"}`}>
              {plan.name} Plan
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-black">${plan.priceMonthlyUsd}</span>
              <span className={`pb-2 text-xs font-black uppercase tracking-widest ${plan.highlighted ? "text-slate-300" : "text-slate-500"}`}>
                / month
              </span>
            </div>
            <p className={`mt-5 text-sm font-medium leading-7 ${plan.highlighted ? "text-slate-300" : "text-slate-600"}`}>
              {plan.description}
            </p>
            <div className="mt-8 space-y-3">
              {plan.features.map((feature) => (
                <div
                  key={feature}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                    plan.highlighted ? "bg-white/10 text-white" : "bg-[#f4efe5] text-slate-900"
                  }`}
                >
                  {feature}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-[24px] border border-dashed px-4 py-4">
              <p className={`text-[10px] font-black uppercase tracking-[0.26em] ${plan.highlighted ? "text-emerald-300" : "text-slate-500"}`}>
                Included Limits
              </p>
              <p className={`mt-3 text-sm font-medium leading-6 ${plan.highlighted ? "text-slate-300" : "text-slate-600"}`}>
                {plan.limits.aiGenerations} AI generations, {plan.limits.chatbotInteractions} chatbot interactions,
                and up to {plan.limits.socialAccounts} connected social account{plan.limits.socialAccounts > 1 ? "s" : ""}.
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Why This Pricing Works
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-slate-900">
            One Booking Pays For Everything
          </h2>
          <p className="mt-5 text-base font-medium leading-8 text-slate-600">
            If one safari booking is worth $1,000 or more, a single extra client can comfortably
            cover the subscription. Everything after that is profit. That is why the platform is
            positioned around bookings generated, not software jargon.
          </p>
        </div>

        <div className="rounded-[32px] bg-[linear-gradient(180deg,#234232_0%,#173121_100%)] p-8 text-white shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
            Add-Ons
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight">
            Need More Power?
          </h2>
          <div className="mt-6 space-y-3">
            {[
              "$10 for 100 extra AI generations",
              "$15 for an additional social account",
              "WhatsApp message bundles for high-volume operators",
              "Yearly billing discounts for stronger retention",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default PricingPage;
