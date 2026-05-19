import React from "react";

const cards = [
  { key: "liveTourCount", label: "Live Tours", tone: "from-zinc-950 via-zinc-900 to-zinc-800", text: "text-white" },
  { key: "departureCount", label: "Published Departures", tone: "from-emerald-500 via-emerald-400 to-lime-300", text: "text-zinc-950" },
  { key: "savedTripCount", label: "Saved Trips", tone: "from-sky-500 via-cyan-400 to-cyan-200", text: "text-zinc-950" },
  { key: "reminderWatcherCount", label: "Reminder Watchers", tone: "from-amber-400 via-orange-300 to-yellow-200", text: "text-zinc-950" },
];

const AvailabilitySummaryStrip = ({ summary = {} }) => (
  <div className="grid gap-4 xl:grid-cols-4">
    {cards.map((card) => (
      <div
        key={card.key}
        className={`rounded-[1.75rem] bg-gradient-to-br ${card.tone} px-5 py-5 shadow-sm`}
      >
        <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${card.text} opacity-75`}>
          {card.label}
        </p>
        <p className={`mt-3 text-3xl font-black tracking-tight ${card.text}`}>
          {summary[card.key] || 0}
        </p>
      </div>
    ))}
  </div>
);

export default AvailabilitySummaryStrip;
