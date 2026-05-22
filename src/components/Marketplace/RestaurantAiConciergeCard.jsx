/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { FaMagic, FaShieldAlt } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { requestRestaurantConciergeRecommendations } from "../../services/api";
import {
  getRestaurantFitExplanation,
  getRestaurantTrustSummary,
} from "./restaurantTrustUtils";

const createInitialDraft = (restaurant = {}) => ({
  destination: restaurant.destination || "",
  mealType: restaurant.mealTypes?.[0] || "",
  cuisineTypesText: (restaurant.cuisineTypes || []).join(", "),
  dietaryFitsText: (restaurant.dietaryFits || []).join(", "),
  ambianceTagsText: (restaurant.ambianceTags || []).join(", "),
  tripIntent: "restaurant-fit",
});

const toArray = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const RestaurantAiConciergeCard = ({ restaurant = {} }) => {
  const [draft, setDraft] = useState(() => createInitialDraft(restaurant));
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const requestPayload = useMemo(
    () => ({
      destination: draft.destination,
      mealType: draft.mealType,
      cuisineTypes: toArray(draft.cuisineTypesText),
      dietaryFits: toArray(draft.dietaryFitsText),
      ambianceTags: toArray(draft.ambianceTagsText),
      tripIntent: draft.tripIntent,
    }),
    [draft]
  );

  const updateField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setStatus("");
  };

  const loadRecommendations = async () => {
    setLoading(true);
    setStatus("");

    try {
      const response = await requestRestaurantConciergeRecommendations(requestPayload);
      setRecommendations(response.data?.recommendations || []);
      if (!response.data?.recommendations?.length) {
        setStatus("No close restaurant matches were found yet for those dining preferences.");
      }
    } catch (error) {
      console.error("Restaurant concierge request failed:", error);
      setStatus("The restaurant concierge could not compare options right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-[#d8c8ae] bg-white p-6 shadow-[0_18px_60px_rgba(35,66,50,0.08)]">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
        <FaMagic className="text-primary" /> AI dining concierge
      </p>
      <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-slate-900">
        Why this restaurant may fit
      </h2>
      <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
        {getRestaurantFitExplanation(restaurant)}
      </p>
      <div className="mt-5 rounded-2xl bg-[#f8f5ee] p-4">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
          <FaShieldAlt /> Grounded trust summary
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
          {getRestaurantTrustSummary(restaurant)}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-[#e5dac8] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
              Compare with AI
            </p>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Tell the concierge what matters and compare grounded dining fits.
            </p>
          </div>
          <button
            type="button"
            onClick={loadRecommendations}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#234232] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white disabled:bg-slate-300"
          >
            <FaWandMagicSparkles /> {loading ? "Comparing..." : "Compare For Me"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              Destination
            </span>
            <input
              value={draft.destination}
              onChange={(event) => updateField("destination", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              Meal type
            </span>
            <input
              value={draft.mealType}
              onChange={(event) => updateField("mealType", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-primary"
            />
          </label>
        </div>

        {[
          ["cuisineTypesText", "Cuisine types"],
          ["dietaryFitsText", "Dietary fits"],
          ["ambianceTagsText", "Atmosphere"],
        ].map(([key, label]) => (
          <label key={key} className="mt-3 block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              {label}
            </span>
            <input
              value={draft[key]}
              onChange={(event) => updateField(key, event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-primary"
            />
          </label>
        ))}

        {status ? <p className="mt-3 text-sm font-semibold text-slate-600">{status}</p> : null}

        {recommendations.length ? (
          <div className="mt-4 space-y-3">
            {recommendations.map((item) => (
              <div key={item.restaurantId} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      {item.destination || "Destination pending"}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#eef4ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#234232]">
                    Fit {item.fitScore}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm font-medium leading-6 text-slate-600">
                  {item.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold text-slate-500">{item.guardrail}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RestaurantAiConciergeCard;
