import { Link } from "react-router-dom";
import {
  FaChartLine,
  FaConciergeBell,
  FaGlobeAfrica,
  FaHandshake,
  FaMapMarkedAlt,
  FaRobot,
  FaStar,
  FaStore,
  FaUtensils,
  FaWhatsapp,
} from "react-icons/fa";
import SEO from "../components/UI/SEO";

const lifecycle = [
  {
    label: "Capture",
    title: "Turn traffic into qualified travel leads",
    text: "Use marketplace discovery, landing pages, forms, chat, WhatsApp, and social funnels to collect traveler demand from every channel.",
    items: ["Marketplace discovery", "AI chat capture", "Lead scoring", "Tour inquiry forms"],
  },
  {
    label: "Nurture",
    title: "Follow up before the traveler goes cold",
    text: "Keep every inquiry moving with unified inbox context, WhatsApp follow-ups, email nurturing, and human-reviewed AI suggestions.",
    items: ["Unified inbox", "WhatsApp automation", "Email follow-up", "Agent recommendations"],
  },
  {
    label: "Close",
    title: "Move from conversation to confirmed booking",
    text: "Generate quotes, payment links, invoices, itineraries, and operator-ready booking records without stitching tools together.",
    items: ["Quote proposals", "Payment checkout", "Invoice PDFs", "Traveler portal"],
  },
  {
    label: "Reactivate",
    title: "Create repeat customers and partner revenue",
    text: "Bring past travelers back, collect reviews, grow referrals, and sell tours through a commission-ready operator marketplace.",
    items: ["Review requests", "Repeat campaigns", "Partner marketplace", "Commission growth"],
  },
];

const platformStats = [
  ["Multi-tenant", "operator websites"],
  ["AI agents", "for sales and service"],
  ["Unified operations", "shared business foundation"],
  ["Marketplace", "commission-ready inventory"],
];

const solutionCards = [
  {
    icon: <FaGlobeAfrica />,
    title: "Traveler marketplace",
    text: "A public discovery layer where travelers can compare tours from verified operators and request the right package.",
  },
  {
    icon: <FaRobot />,
    title: "AI operating layer",
    text: "Agent-assisted sales, support, follow-up, content, pricing, and intelligence workflows built around tourism.",
  },
  {
    icon: <FaWhatsapp />,
    title: "WhatsApp-first selling",
    text: "Bring high-intent conversations into a unified inbox with recommended next actions and audit logs.",
  },
  {
    icon: <FaHandshake />,
    title: "Partner commissions",
    text: "Let operators, agencies, hotels, creators, and affiliates discover inventory and build commission partnerships.",
  },
];

const bookingSteps = [
  "Travelers discover verified tours in the marketplace.",
  "They compare operators, destinations, pricing, and availability signals.",
  "They request a quote or start a WhatsApp/chat conversation.",
  "The operator receives lead context, AI recommendations, and booking tools.",
];

const PlatformHome = () => (
  <main className="overflow-hidden bg-[#f7f3ea] text-slate-950">
    <SEO
      title="MAZ Expeditions Platform | AI Tourism Growth System"
      description="An AI-powered tourism growth platform for operators, marketplaces, WhatsApp sales, booking automation, and commission partnerships."
      keywords={["tourism platform", "tour marketplace", "AI travel sales", "WhatsApp booking automation"]}
    />

    <section className="relative isolate px-6 pb-20 pt-36 md:px-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(22,101,52,0.24),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(217,119,6,0.18),transparent_32%),linear-gradient(135deg,#f7f3ea_0%,#fffaf0_48%,#e8efe4_100%)]" />
      <div className="absolute left-8 top-28 -z-10 h-28 w-28 rounded-full border border-emerald-900/10" />
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="inline-flex rounded-full border border-emerald-800/20 bg-white/60 px-4 py-2 text-[11px] font-black uppercase tracking-[0.32em] text-emerald-800 shadow-sm">
            AI-powered tourism growth platform
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-tighter text-slate-950 md:text-7xl">
            Run bookings, operators, and marketplace growth from one platform.
          </h1>
          <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-slate-650">
            MAZ helps tourism businesses capture leads, nurture conversations, close bookings,
            and grow commission partnerships with AI built around real travel operations.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              to="/discover"
              className="rounded-full bg-[#2f5b3a] px-7 py-4 text-sm font-black uppercase tracking-[0.22em] text-white shadow-2xl shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-[#24492f]"
            >
              Explore Marketplace
            </Link>
            <Link
              to="/pricing"
              className="rounded-full border border-[#cdbd9c] bg-white/80 px-7 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#2b241c] transition hover:border-[#2f5b3a] hover:text-[#2f5b3a]"
            >
              See Pricing
            </Link>
            <Link
              to="/discover/hotels"
              className="rounded-full border border-emerald-800/20 bg-white/80 px-7 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#2f5b3a] transition hover:border-[#2f5b3a] hover:bg-white"
            >
              Browse Hotels
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[42px] border border-white/70 bg-slate-950 p-5 text-white shadow-2xl shadow-emerald-950/20">
            <div className="rounded-[32px] bg-[linear-gradient(160deg,#123524,#1f3d2c_52%,#9a6b2e)] p-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100">
                  Growth Command
                </p>
                <FaChartLine className="text-amber-200" />
              </div>
              <div className="mt-8 grid gap-3">
                {["New traveler lead", "AI sales recommendation", "Quote ready", "Partner commission match"].map((item, index) => (
                  <div key={item} className="rounded-2xl bg-white/12 px-4 py-4 backdrop-blur">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-black">{item}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-950">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-[26px] bg-white p-5 text-slate-950">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  Today&apos;s pipeline
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {["27 leads", "9 quotes", "4 bookings"].map((item) => (
                    <div key={item} className="rounded-2xl bg-amber-50 px-3 py-4 text-center text-sm font-black">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="border-y border-[#d9ccb4] bg-[#fffaf1] px-6 py-8 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
        {platformStats.map(([value, label]) => (
          <div key={value} className="rounded-3xl bg-[#f2ebde] px-5 py-6">
            <p className="text-2xl font-black uppercase tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.24em] text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>

    <section id="features" className="px-6 py-20 md:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-800">
          One platform, full tourism lifecycle
        </p>
        <h2 className="mt-4 max-w-4xl text-4xl font-black uppercase tracking-tight md:text-5xl">
          Capture, Nurture, Close, and Reactivate demand.
        </h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {lifecycle.map((stage) => (
            <article key={stage.label} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-700">{stage.label}</p>
              <h3 className="mt-4 text-xl font-black uppercase tracking-tight">{stage.title}</h3>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">{stage.text}</p>
              <div className="mt-6 space-y-2">
                {stage.items.map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-[linear-gradient(180deg,#234232_0%,#16281f_100%)] px-6 py-20 text-white md:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-amber-300">
            What we offer
          </p>
          <h2 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-5xl">
            Built for tourism operators, not generic sales teams.
          </h2>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-300">
            The platform connects discovery, sales conversations, operational records, and marketplace partnerships so a booking can move from first click to confirmed itinerary.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {solutionCards.map((card) => (
            <article key={card.title} className="rounded-[30px] border border-white/10 bg-white/8 p-6">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-amber-300 text-slate-950">
                {card.icon}
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">{card.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section id="how-it-works" className="px-6 py-20 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="rounded-[36px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-emerald-100 text-emerald-800">
            <FaMapMarkedAlt />
          </div>
          <h2 className="mt-6 text-4xl font-black uppercase tracking-tight">
            How travelers book through the platform
          </h2>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
            The public marketplace should feel close to a serious travel discovery engine, while the operator backend handles the sales and operational work after the traveler shows intent.
          </p>
        </div>
        <div className="space-y-4">
          {bookingSteps.map((step, index) => (
            <div key={step} className="flex gap-4 rounded-[28px] border border-slate-200 bg-white p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#2f5b3a] text-sm font-black text-white">
                {index + 1}
              </span>
              <p className="pt-2 text-sm font-black uppercase tracking-wide text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Restaurant owner section */}
    <section className="px-6 py-20 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-[36px] border border-[#d9ccb4] bg-white p-8 shadow-sm">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-100 text-amber-800">
              <FaUtensils />
            </div>
            <h2 className="mt-6 text-4xl font-black uppercase tracking-tight">
              Own a restaurant?
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
              Claim your restaurant listing, manage reservations, set up deposits, and receive payments
              — all from your partner dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/discover/restaurants/claim"
                className="inline-flex items-center gap-3 rounded-full bg-[#2f5b3a] px-7 py-4 text-sm font-black uppercase tracking-[0.22em] text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#24492f]"
              >
                <FaStore />
                Claim your restaurant
              </Link>
              <Link
                to="/restaurant-partner/login"
                className="inline-flex items-center gap-3 rounded-full border border-[#cdbd9c] bg-white/80 px-7 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#2b241c] transition hover:border-[#2f5b3a] hover:text-[#2f5b3a]"
              >
                <FaConciergeBell />
                Partner login
              </Link>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              {
                title: "Claim your listing",
                text: "Search for your restaurant in the marketplace and submit a claim request to become the verified partner.",
              },
              {
                title: "Manage reservations",
                text: "View incoming requests, confirm or adjust bookings, and communicate with travelers through your dashboard.",
              },
              {
                title: "Accept deposits",
                text: "Set up deposit amounts, enable auto-deposits on confirmation, and receive payments directly through the platform.",
              },
              {
                title: "Grow your presence",
                text: "Update your menu, manage availability, and get discovered by travelers browsing restaurants in your destination.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-[28px] border border-[#e3d7c2] bg-[#fcfaf6] p-5">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#234232] text-xs text-white">
                  <FaUtensils />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-slate-800">{item.title}</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="px-6 pb-24 md:px-10">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[42px] bg-[linear-gradient(135deg,#305d3b,#173121)] p-8 text-white shadow-2xl md:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-amber-300">
              Ready for growth
            </p>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-5xl">
              Explore tours now, or see how operators use MAZ to grow bookings.
            </h2>
          </div>
          <div className="flex flex-wrap gap-4 lg:justify-end">
            <Link to="/discover" className="rounded-full bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-slate-950">
              Browse Tours
            </Link>
            <Link to="/discover/hotels" className="rounded-full bg-amber-300 px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-slate-950">
              Browse Hotels
            </Link>
            <Link to="/demo/mazexpeditions" className="rounded-full border border-white/30 px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-white">
              View Demo Site
            </Link>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Operators", "Launch a better website, manage bookings, and sell through partners."],
            ["Partners", "Promote verified tours and grow commission revenue."],
            ["Travelers", "Discover trusted packages from the MAZ operator network."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-[26px] bg-white/10 p-5">
              <FaStar className="text-amber-300" />
              <h3 className="mt-4 text-lg font-black uppercase">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </main>
);

export default PlatformHome;
