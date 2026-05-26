import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaHotel, FaMagic, FaRoute, FaUtensils } from "react-icons/fa";
import { fetchHospitalityRecommendations } from "../../services/api";
import {
  buildHospitalityRecommendationQuery,
  normalizeHospitalityRecommendations,
} from "./hospitalityIntelligenceState";

const iconMap = {
  hotel: FaHotel,
  restaurant: FaUtensils,
  tour: FaRoute,
};

const HospitalityPairingPanel = ({
  context = {},
  title = "Complete this trip with hospitality pairings",
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [emptyReason, setEmptyReason] = useState("");
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => buildHospitalityRecommendationQuery(context), [context]);

  useEffect(() => {
    let active = true;

    const loadRecommendations = async () => {
      if (!query.sourceType) return;

      setLoading(true);
      try {
        const response = await fetchHospitalityRecommendations(query);
        if (!active) return;

        setRecommendations(response.data?.recommendations || []);
        setEmptyReason(response.data?.emptyReason || "");
      } catch (error) {
        console.error("Hospitality recommendations error:", error);
        if (active) {
          setRecommendations([]);
          setEmptyReason("No strong hospitality pairings yet.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRecommendations();

    return () => {
      active = false;
    };
  }, [query]);

  const cards = useMemo(
    () => normalizeHospitalityRecommendations(recommendations),
    [recommendations]
  );

  if (!loading && !cards.length && !emptyReason) return null;

  return (
    <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_24px_80px_rgba(35,66,50,0.10)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
            <FaMagic /> Hospitality intelligence
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
            AI pairs trusted stays, dining, and trips from marketplace data.
            Confirm live availability, pricing, and supplier commitments before
            checkout.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 rounded-3xl bg-[#f6f1e8] p-5 text-sm font-bold text-slate-500">
          Finding hospitality pairings...
        </div>
      ) : cards.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = iconMap[card.targetType] || FaMagic;

            return (
              <Link
                key={card.id}
                to={card.href}
                className="group rounded-[28px] border border-[#d8c8ae] bg-[#fffaf1] p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(35,66,50,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-2xl bg-[#234232] p-3 text-white">
                    <Icon />
                  </span>
                  <span className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7451]">
                    {card.sponsoredLabel}
                  </span>
                </div>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
                  {card.label} / {card.confidenceLabel}
                </p>
                <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  {card.primaryReason}
                </p>
                <p className="mt-4 text-[11px] font-bold leading-5 text-slate-500">
                  {card.disclaimer}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl bg-[#f6f1e8] p-5 text-sm font-bold text-slate-500">
          {emptyReason || "No strong hospitality pairings yet."}
        </div>
      )}
    </section>
  );
};

export default HospitalityPairingPanel;
