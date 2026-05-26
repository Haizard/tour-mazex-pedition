# Hospitality Intelligence Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a V1 AI-native hospitality recommendation layer that pairs tours, hotels, and restaurants with grounded fit explanations and revenue attribution metadata.

**Architecture:** Add a pure backend scorer in `backend/utils/hospitalityIntelligence.js`, expose it through a small public API, then render recommendations through reusable marketplace state and UI components. V1 uses deterministic scoring from existing Mongo-backed entities and creates clear attribution metadata without requiring a new Postgres or pgvector runtime dependency.

**Tech Stack:** Node.js ESM, Express, Mongoose models, React, existing `src/services/api.js`, Node test runner, Vite build.

---

## File Structure

- Create `backend/utils/hospitalityIntelligence.js`: pure scoring, shaping, attribution, and trust disclaimers.
- Create `backend/tests/hospitalityIntelligence.test.js`: deterministic utility coverage.
- Modify `backend/routes/discoveryRoutes.js`: add public recommendations endpoint near existing public discovery routes.
- Create `backend/tests/hospitalityIntelligenceRoutes.test.js`: route source check and behavior where practical.
- Modify `src/services/api.js`: add `fetchHospitalityRecommendations`.
- Create `src/components/Marketplace/hospitalityIntelligenceState.js`: frontend card/state shaping and CTA payload helpers.
- Create `src/components/Marketplace/hospitalityIntelligenceState.test.js`: state helper coverage.
- Create `src/components/Marketplace/HospitalityPairingPanel.jsx`: reusable traveler-facing panel.
- Modify `src/pages/HotelDetail.jsx`: mount the panel for hotel source context.
- Modify `src/pages/RestaurantDetail.jsx`: mount the panel for restaurant source context.
- Optional safe extension if time remains: modify `src/pages/DiscoveryTourDetail.jsx` to mount tour-source recommendations after locating the tour detail data shape.

## Task 1: Backend Recommendation Utility

**Files:**
- Create: `backend/utils/hospitalityIntelligence.js`
- Test: `backend/tests/hospitalityIntelligence.test.js`

- [ ] **Step 1: Write failing utility tests**

Create `backend/tests/hospitalityIntelligence.test.js` with:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHospitalityRecommendations,
  buildHospitalityAttribution,
} from "../utils/hospitalityIntelligence.js";

test("buildHospitalityRecommendations pairs a tour with hotels and restaurants by destination", () => {
  const result = buildHospitalityRecommendations({
    source: {
      type: "tour",
      id: "tour_1",
      name: "Serengeti Family Safari",
      destination: "Arusha",
      region: "Northern Circuit",
      travelerContext: { mealType: "dinner", dietaryFits: ["vegetarian"], tripStyle: "family" },
    },
    hotels: [
      {
        _id: "hotel_1",
        name: "Arusha Garden Lodge",
        slug: "arusha-garden-lodge",
        destination: "Arusha",
        region: "Northern Circuit",
        roomStyleSummary: "Family garden rooms",
        averageRating: 4.8,
        reviewCount: 32,
        sponsoredPlacement: true,
        published: true,
        marketplaceVisible: true,
      },
    ],
    restaurants: [
      {
        _id: "restaurant_1",
        name: "Garden Table",
        slug: "garden-table",
        destination: "Arusha",
        region: "Northern Circuit",
        mealTypes: ["dinner"],
        dietaryFits: ["vegetarian"],
        ambianceTags: ["family"],
        averageRating: 4.6,
        reviewCount: 18,
        published: true,
        marketplaceVisible: true,
      },
    ],
    sessionKey: "traveler_123",
    surface: "tour-detail",
  });

  assert.equal(result.recommendations.length, 2);
  assert.equal(result.recommendations[0].sourceType, "tour");
  assert.equal(result.recommendations[0].attribution.sessionKey, "traveler_123");
  assert.equal(result.recommendations.some((item) => item.targetType === "hotel"), true);
  assert.equal(result.recommendations.some((item) => item.targetType === "restaurant"), true);
  assert.equal(
    result.recommendations.every((item) => item.disclaimer.includes("recommendation")),
    true
  );
});

test("buildHospitalityRecommendations filters unpublished public entities", () => {
  const result = buildHospitalityRecommendations({
    source: { type: "hotel", id: "hotel_1", name: "Known Hotel", destination: "Arusha" },
    restaurants: [
      { _id: "hidden", name: "Hidden", published: false, marketplaceVisible: true, destination: "Arusha" },
      { _id: "visible", name: "Visible", slug: "visible", published: true, marketplaceVisible: true, destination: "Arusha" },
    ],
  });

  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0].targetId, "visible");
});

test("buildHospitalityAttribution preserves recommendation revenue context", () => {
  assert.deepEqual(
    buildHospitalityAttribution({
      recommendationSource: "ai-hospitality-intelligence",
      sourceEntityType: "hotel",
      sourceEntityId: "hotel_1",
      recommendedEntityType: "restaurant",
      recommendedEntityId: "restaurant_1",
      surface: "hotel-detail",
      sponsored: true,
      sessionKey: "traveler_123",
    }),
    {
      recommendationSource: "ai-hospitality-intelligence",
      sourceEntityType: "hotel",
      sourceEntityId: "hotel_1",
      recommendedEntityType: "restaurant",
      recommendedEntityId: "restaurant_1",
      surface: "hotel-detail",
      sponsored: true,
      sessionKey: "traveler_123",
      inquiryId: null,
      bookingId: null,
      paymentId: null,
    }
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test backend/tests/hospitalityIntelligence.test.js
```

Expected: `ERR_MODULE_NOT_FOUND` or named export failure for `hospitalityIntelligence.js`.

- [ ] **Step 3: Implement the utility**

Create `backend/utils/hospitalityIntelligence.js` with:

```js
const toId = (value) => String(value?._id || value?.id || value || "");
const toText = (value) => String(value || "").trim();
const toLower = (value) => toText(value).toLowerCase();
const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const isPublicEntity = (entity = {}) =>
  entity.published !== false && entity.marketplaceVisible !== false && toId(entity);

const includesText = (list = [], needle = "") => {
  const normalizedNeedle = toLower(needle);
  return normalizedNeedle
    ? asArray(list).some((item) => toLower(item).includes(normalizedNeedle) || normalizedNeedle.includes(toLower(item)))
    : false;
};

const buildTargetUrl = (type, entity = {}) => {
  if (type === "hotel") return `/discover/hotels/${entity.slug || toId(entity)}`;
  if (type === "restaurant") return `/discover/restaurants/${entity.slug || toId(entity)}`;
  if (type === "tour") return `/discover/tour/${toId(entity)}`;
  return "/discover";
};

export const buildHospitalityAttribution = ({
  recommendationSource = "ai-hospitality-intelligence",
  sourceEntityType = "",
  sourceEntityId = "",
  recommendedEntityType = "",
  recommendedEntityId = "",
  surface = "marketplace",
  sponsored = false,
  sessionKey = "",
  inquiryId = null,
  bookingId = null,
  paymentId = null,
} = {}) => ({
  recommendationSource,
  sourceEntityType,
  sourceEntityId,
  recommendedEntityType,
  recommendedEntityId,
  surface,
  sponsored: sponsored === true,
  sessionKey: sessionKey || "",
  inquiryId,
  bookingId,
  paymentId,
});

const scoreCandidate = ({ source = {}, candidate = {}, type = "", travelerContext = {} }) => {
  const reasons = [];
  let score = 20;

  if (toLower(source.destination) && toLower(source.destination) === toLower(candidate.destination)) {
    score += 28;
    reasons.push(`Matches ${candidate.destination} trip flow.`);
  }

  if (toLower(source.region) && toLower(source.region) === toLower(candidate.region)) {
    score += 16;
    reasons.push(`Fits the ${candidate.region} region.`);
  }

  if (candidate.sponsoredPlacement === true) {
    score += 6;
    reasons.push("Sponsored partner with marketplace visibility.");
  }

  if (Number(candidate.averageRating || 0) >= 4.5) {
    score += 8;
    reasons.push(`Strong traveler proof from ${candidate.averageRating} rating.`);
  }

  if (Number(candidate.reviewCount || 0) > 0) {
    score += Math.min(8, Number(candidate.reviewCount || 0) / 6);
    reasons.push(`${candidate.reviewCount} review signals available.`);
  }

  if (type === "restaurant") {
    if (includesText(candidate.mealTypes, travelerContext.mealType)) {
      score += 12;
      reasons.push(`Good ${travelerContext.mealType} timing fit.`);
    }
    asArray(travelerContext.dietaryFits).forEach((dietaryFit) => {
      if (includesText(candidate.dietaryFits, dietaryFit)) {
        score += 8;
        reasons.push(`Supports ${dietaryFit} dining needs.`);
      }
    });
    if (includesText(candidate.ambianceTags, travelerContext.tripStyle)) {
      score += 8;
      reasons.push(`Ambiance fits a ${travelerContext.tripStyle} trip.`);
    }
  }

  if (type === "hotel" && candidate.roomStyleSummary) {
    score += 8;
    reasons.push(`Stay style: ${candidate.roomStyleSummary}.`);
  }

  return {
    score: Math.round(score),
    reasons: reasons.length ? reasons : ["Recommended from marketplace hospitality context."],
  };
};

const shapeRecommendation = ({ source, candidate, type, scored, surface, sessionKey }) => ({
  recommendationId: `${source.type || "source"}:${toId(source.id || source._id)}:${type}:${toId(candidate)}`,
  sourceType: source.type || "marketplace",
  sourceId: toId(source.id || source._id),
  targetType: type,
  targetId: toId(candidate),
  title: candidate.name || candidate.title || "Hospitality recommendation",
  slug: candidate.slug || "",
  url: buildTargetUrl(type, candidate),
  destination: candidate.destination || "",
  region: candidate.region || "",
  fitScore: scored.score,
  confidence: scored.score >= 70 ? "high" : scored.score >= 45 ? "medium" : "emerging",
  reasons: scored.reasons.slice(0, 4),
  trustNotes: [
    candidate.trustSummary,
    candidate.averageRating ? `${candidate.averageRating} average rating` : "",
    candidate.reviewCount ? `${candidate.reviewCount} reviews` : "",
  ].filter(Boolean),
  sponsored: candidate.sponsoredPlacement === true,
  disclaimer:
    "AI recommendation only. Availability, pricing, table space, room inventory, and supplier commitments must be confirmed through the platform workflow.",
  attribution: buildHospitalityAttribution({
    sourceEntityType: source.type || "marketplace",
    sourceEntityId: toId(source.id || source._id),
    recommendedEntityType: type,
    recommendedEntityId: toId(candidate),
    surface,
    sponsored: candidate.sponsoredPlacement === true,
    sessionKey,
  }),
});

export const buildHospitalityRecommendations = ({
  source = {},
  hotels = [],
  restaurants = [],
  tours = [],
  sessionKey = "",
  surface = "marketplace",
  limitPerType = 3,
} = {}) => {
  const travelerContext = {
    ...(source.travelerContext || {}),
  };
  const sourceType = source.type || "marketplace";

  const pools = [
    ["hotel", hotels],
    ["restaurant", restaurants],
    ["tour", tours],
  ].filter(([type]) => type !== sourceType);

  const recommendations = pools.flatMap(([type, candidates]) =>
    asArray(candidates)
      .filter(isPublicEntity)
      .map((candidate) => {
        const scored = scoreCandidate({ source, candidate, type, travelerContext });
        return shapeRecommendation({ source, candidate, type, scored, surface, sessionKey });
      })
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, limitPerType)
  );

  return {
    source: {
      type: sourceType,
      id: toId(source.id || source._id),
      name: source.name || source.title || "",
      destination: source.destination || "",
      region: source.region || "",
    },
    recommendations: recommendations.sort((a, b) => b.fitScore - a.fitScore),
    emptyReason: recommendations.length ? "" : "No strong hospitality pairings yet.",
  };
};
```

- [ ] **Step 4: Run utility tests to verify pass**

Run:

```bash
node --test backend/tests/hospitalityIntelligence.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Commit utility**

Run:

```bash
git add backend/utils/hospitalityIntelligence.js backend/tests/hospitalityIntelligence.test.js
git commit -m "feat: add hospitality intelligence scorer"
```

## Task 2: Public API Endpoint

**Files:**
- Modify: `backend/routes/discoveryRoutes.js`
- Test: `backend/tests/hospitalityIntelligenceRoutes.test.js`

- [ ] **Step 1: Write route source test**

Create `backend/tests/hospitalityIntelligenceRoutes.test.js` with:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("discovery routes expose hospitality recommendation endpoint", async () => {
  const source = await readFile(new URL("../routes/discoveryRoutes.js", import.meta.url), "utf8");

  assert.equal(source.includes('router.get("/hospitality/recommendations"'), true);
  assert.equal(source.includes("buildHospitalityRecommendations"), true);
  assert.equal(source.includes("Hotel.find"), true);
  assert.equal(source.includes("Restaurant.find"), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node --test backend/tests/hospitalityIntelligenceRoutes.test.js
```

Expected: FAIL because the route and import do not exist.

- [ ] **Step 3: Add imports to `backend/routes/discoveryRoutes.js`**

Add near existing model imports:

```js
import Hotel from "../models/Hotel.js";
import Restaurant from "../models/Restaurant.js";
import { buildHospitalityRecommendations } from "../utils/hospitalityIntelligence.js";
```

- [ ] **Step 4: Add route before `export default router`**

Add:

```js
router.get("/hospitality/recommendations", async (req, res) => {
  try {
    const sourceType = String(req.query.sourceType || "").trim();
    const sourceId = String(req.query.sourceId || "").trim();
    const sourceSlug = String(req.query.sourceSlug || "").trim();
    const surface = String(req.query.surface || "marketplace").trim();
    const sessionKey = String(req.query.sessionKey || "").trim();

    let source = {
      type: sourceType || "marketplace",
      id: sourceId || sourceSlug,
      name: "",
      destination: String(req.query.destination || "").trim(),
      region: String(req.query.region || "").trim(),
      travelerContext: {
        mealType: String(req.query.mealType || "").trim(),
        tripStyle: String(req.query.tripStyle || "").trim(),
        dietaryFits: String(req.query.dietaryFits || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
    };

    if (sourceType === "hotel" && sourceSlug) {
      const hotel = await Hotel.findOne({
        slug: sourceSlug,
        published: true,
        marketplaceVisible: true,
      }).lean();
      if (hotel) {
        source = {
          ...source,
          type: "hotel",
          id: String(hotel._id),
          name: hotel.name,
          destination: hotel.destination || source.destination,
          region: hotel.region || source.region,
        };
      }
    }

    if (sourceType === "restaurant" && sourceSlug) {
      const restaurant = await Restaurant.findOne({
        slug: sourceSlug,
        published: true,
        marketplaceVisible: true,
      }).lean();
      if (restaurant) {
        source = {
          ...source,
          type: "restaurant",
          id: String(restaurant._id),
          name: restaurant.name,
          destination: restaurant.destination || source.destination,
          region: restaurant.region || source.region,
          travelerContext: {
            ...source.travelerContext,
            mealType: source.travelerContext.mealType || restaurant.mealTypes?.[0] || "",
          },
        };
      }
    }

    if (sourceType === "tour" && sourceId) {
      const tour = await TourPackage.findOne({
        _id: sourceId,
        isMarketplaceVisible: true,
      }).lean();
      if (tour) {
        source = {
          ...source,
          type: "tour",
          id: String(tour._id),
          name: tour.title || "",
          destination: tour.location || source.destination,
          region: source.region,
        };
      }
    }

    const [hotels, restaurants, tours] = await Promise.all([
      Hotel.find({ published: true, marketplaceVisible: true })
        .sort({ sponsoredPlacement: -1, averageRating: -1, reviewCount: -1 })
        .limit(24)
        .lean(),
      Restaurant.find({ published: true, marketplaceVisible: true })
        .sort({ sponsoredPlacement: -1, averageRating: -1, reviewCount: -1 })
        .limit(24)
        .lean(),
      TourPackage.find({ isMarketplaceVisible: true })
        .sort({ featured: -1, createdAt: -1 })
        .limit(24)
        .lean(),
    ]);

    return res.status(200).json(
      buildHospitalityRecommendations({
        source,
        hotels,
        restaurants,
        tours,
        sessionKey,
        surface,
      })
    );
  } catch (error) {
    return res.status(200).json({
      source: { type: "marketplace", id: "", name: "", destination: "", region: "" },
      recommendations: [],
      emptyReason: "No strong hospitality pairings yet.",
      error: error.message,
    });
  }
});
```

- [ ] **Step 5: Run backend tests**

Run:

```bash
node --test backend/tests/hospitalityIntelligence.test.js backend/tests/hospitalityIntelligenceRoutes.test.js
```

Expected: all tests pass.

- [ ] **Step 6: Commit route**

Run:

```bash
git add backend/routes/discoveryRoutes.js backend/tests/hospitalityIntelligenceRoutes.test.js
git commit -m "feat: expose hospitality recommendations api"
```

## Task 3: Frontend State Helper And API Client

**Files:**
- Modify: `src/services/api.js`
- Create: `src/components/Marketplace/hospitalityIntelligenceState.js`
- Test: `src/components/Marketplace/hospitalityIntelligenceState.test.js`

- [ ] **Step 1: Write frontend state tests**

Create `src/components/Marketplace/hospitalityIntelligenceState.test.js` with:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHospitalityRecommendationQuery,
  getHospitalityRecommendationLabel,
  normalizeHospitalityRecommendations,
} from "./hospitalityIntelligenceState.js";

test("buildHospitalityRecommendationQuery shapes hotel detail request params", () => {
  assert.deepEqual(
    buildHospitalityRecommendationQuery({
      sourceType: "hotel",
      sourceSlug: "arusha-garden-lodge",
      surface: "hotel-detail",
      destination: "Arusha",
      sessionKey: "traveler_123",
    }),
    {
      sourceType: "hotel",
      sourceSlug: "arusha-garden-lodge",
      sourceId: "",
      surface: "hotel-detail",
      destination: "Arusha",
      region: "",
      sessionKey: "traveler_123",
    }
  );
});

test("normalizeHospitalityRecommendations preserves fit, disclaimer, and sponsored labels", () => {
  const cards = normalizeHospitalityRecommendations([
    {
      recommendationId: "hotel:1:restaurant:2",
      targetType: "restaurant",
      title: "Garden Table",
      url: "/discover/restaurants/garden-table",
      fitScore: 82,
      reasons: ["Good dinner timing fit."],
      sponsored: true,
      disclaimer: "AI recommendation only.",
      attribution: { sponsored: true },
    },
  ]);

  assert.equal(cards[0].label, "Dining add-on");
  assert.equal(cards[0].sponsoredLabel, "Sponsored");
  assert.equal(cards[0].confidenceLabel, "High fit");
  assert.equal(cards[0].primaryReason, "Good dinner timing fit.");
  assert.equal(cards[0].disclaimer, "AI recommendation only.");
});

test("getHospitalityRecommendationLabel returns useful type labels", () => {
  assert.equal(getHospitalityRecommendationLabel("hotel"), "Stay add-on");
  assert.equal(getHospitalityRecommendationLabel("restaurant"), "Dining add-on");
  assert.equal(getHospitalityRecommendationLabel("tour"), "Trip add-on");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test src/components/Marketplace/hospitalityIntelligenceState.test.js
```

Expected: FAIL because helper file does not exist.

- [ ] **Step 3: Add API function**

Add to `src/services/api.js` near discovery/marketplace public APIs:

```js
export const fetchHospitalityRecommendations = (params = {}) =>
  cachedGet("/discovery/hospitality/recommendations", { params });
```

- [ ] **Step 4: Implement state helper**

Create `src/components/Marketplace/hospitalityIntelligenceState.js` with:

```js
const toTrimmedString = (value) => String(value || "").trim();

export const getHospitalityRecommendationLabel = (targetType = "") => {
  const labels = {
    hotel: "Stay add-on",
    restaurant: "Dining add-on",
    tour: "Trip add-on",
  };
  return labels[targetType] || "Hospitality add-on";
};

export const getHospitalityConfidenceLabel = (fitScore = 0) => {
  const score = Number(fitScore || 0);
  if (score >= 70) return "High fit";
  if (score >= 45) return "Good fit";
  return "Emerging fit";
};

export const buildHospitalityRecommendationQuery = (context = {}) => ({
  sourceType: toTrimmedString(context.sourceType),
  sourceSlug: toTrimmedString(context.sourceSlug),
  sourceId: toTrimmedString(context.sourceId),
  surface: toTrimmedString(context.surface || "marketplace"),
  destination: toTrimmedString(context.destination),
  region: toTrimmedString(context.region),
  sessionKey: toTrimmedString(context.sessionKey),
});

export const normalizeHospitalityRecommendations = (recommendations = []) =>
  (Array.isArray(recommendations) ? recommendations : []).map((item) => ({
    ...item,
    id: item.recommendationId || `${item.targetType}:${item.targetId}`,
    label: getHospitalityRecommendationLabel(item.targetType),
    sponsoredLabel: item.sponsored ? "Sponsored" : "Organic fit",
    confidenceLabel: getHospitalityConfidenceLabel(item.fitScore),
    primaryReason: item.reasons?.[0] || "Recommended from hospitality context.",
    href: item.url || "/discover",
    disclaimer:
      item.disclaimer ||
      "AI recommendation only. Confirm availability, pricing, and commitments before booking.",
  }));
```

- [ ] **Step 5: Run frontend helper tests**

Run:

```bash
node --test src/components/Marketplace/hospitalityIntelligenceState.test.js
```

Expected: all tests pass.

- [ ] **Step 6: Commit state helper**

Run:

```bash
git add src/services/api.js src/components/Marketplace/hospitalityIntelligenceState.js src/components/Marketplace/hospitalityIntelligenceState.test.js
git commit -m "feat: add hospitality recommendation state"
```

## Task 4: Reusable Traveler Pairing Panel

**Files:**
- Create: `src/components/Marketplace/HospitalityPairingPanel.jsx`
- Modify: `src/pages/HotelDetail.jsx`
- Modify: `src/pages/RestaurantDetail.jsx`

- [ ] **Step 1: Create panel component**

Create `src/components/Marketplace/HospitalityPairingPanel.jsx` with:

```jsx
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

const HospitalityPairingPanel = ({ context = {}, title = "Complete this trip with AI" }) => {
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
            AI pairs trusted stays, dining, and trips from marketplace data. Confirm live availability, pricing, and supplier commitments before checkout.
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
                  {card.label} · {card.confidenceLabel}
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
```

- [ ] **Step 2: Mount on hotel detail**

Modify `src/pages/HotelDetail.jsx`:

```jsx
import HospitalityPairingPanel from "../components/Marketplace/HospitalityPairingPanel";
```

Add after `<HotelBookingWidget hotel={hotel} />`:

```jsx
<div className="mt-8">
  <HospitalityPairingPanel
    title="Complete this stay with trips and dining"
    context={{
      sourceType: "hotel",
      sourceSlug: hotel.slug,
      surface: "hotel-detail",
      destination: hotel.destination,
      region: hotel.region,
    }}
  />
</div>
```

- [ ] **Step 3: Mount on restaurant detail**

Modify `src/pages/RestaurantDetail.jsx`:

```jsx
import HospitalityPairingPanel from "../components/Marketplace/HospitalityPairingPanel";
```

Add before `</main>`:

```jsx
<div className="mt-8">
  <HospitalityPairingPanel
    title="Pair this dining moment with stays and trips"
    context={{
      sourceType: "restaurant",
      sourceSlug: restaurant.slug,
      surface: "restaurant-detail",
      destination: restaurant.destination,
      region: restaurant.region,
    }}
  />
</div>
```

- [ ] **Step 4: Run frontend tests and build**

Run:

```bash
node --test src/components/Marketplace/hospitalityIntelligenceState.test.js
npm run build
```

Expected: helper tests pass and Vite build completes.

- [ ] **Step 5: Commit panel**

Run:

```bash
git add src/components/Marketplace/HospitalityPairingPanel.jsx src/pages/HotelDetail.jsx src/pages/RestaurantDetail.jsx
git commit -m "feat: show hospitality pairing recommendations"
```

## Task 5: Operator Recommendation Metadata

**Files:**
- Modify: `backend/utils/hospitalityIntelligence.js`
- Test: `backend/tests/hospitalityIntelligence.test.js`

- [ ] **Step 1: Add failing operator guidance test**

Update the import block at the top of `backend/tests/hospitalityIntelligence.test.js` to include `buildHospitalityOperatorGuidance`, then append the test:

```js
import {
  buildHospitalityAttribution,
  buildHospitalityOperatorGuidance,
  buildHospitalityRecommendations,
} from "../utils/hospitalityIntelligence.js";

test("buildHospitalityOperatorGuidance summarizes package next best action", () => {
  const guidance = buildHospitalityOperatorGuidance({
    source: { type: "tour", name: "Family Safari", destination: "Arusha" },
    recommendations: [
      {
        targetType: "hotel",
        title: "Arusha Garden Lodge",
        confidence: "high",
        reasons: ["Matches Arusha trip flow."],
      },
      {
        targetType: "restaurant",
        title: "Garden Table",
        confidence: "medium",
        reasons: ["Good dinner timing fit."],
      },
    ],
  });

  assert.equal(guidance.packageCompletionHint.includes("Family Safari"), true);
  assert.equal(guidance.nextBestActions.includes("Suggest hotel add-on: Arusha Garden Lodge."), true);
  assert.equal(guidance.nextBestActions.includes("Suggest dining add-on: Garden Table."), true);
});
```

- [ ] **Step 2: Run utility tests to verify failure**

Run:

```bash
node --test backend/tests/hospitalityIntelligence.test.js
```

Expected: FAIL because `buildHospitalityOperatorGuidance` is not exported.

- [ ] **Step 3: Implement operator guidance export**

Add to `backend/utils/hospitalityIntelligence.js`:

```js
export const buildHospitalityOperatorGuidance = ({ source = {}, recommendations = [] } = {}) => {
  const topHotel = recommendations.find((item) => item.targetType === "hotel");
  const topRestaurant = recommendations.find((item) => item.targetType === "restaurant");
  const nextBestActions = [];

  if (topHotel) {
    nextBestActions.push(`Suggest hotel add-on: ${topHotel.title}.`);
  }

  if (topRestaurant) {
    nextBestActions.push(`Suggest dining add-on: ${topRestaurant.title}.`);
  }

  if (!nextBestActions.length) {
    nextBestActions.push("Ask traveler whether they want stay or dining support.");
  }

  return {
    packageCompletionHint: `${source.name || "This lead"} can be packaged with hospitality add-ons in ${source.destination || "the destination"}.`,
    nextBestActions,
    replyGuidance:
      "Offer these as curated recommendations and confirm availability, pricing, and supplier commitments before promising anything.",
  };
};
```

- [ ] **Step 4: Run utility tests**

Run:

```bash
node --test backend/tests/hospitalityIntelligence.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Commit operator metadata**

Run:

```bash
git add backend/utils/hospitalityIntelligence.js backend/tests/hospitalityIntelligence.test.js
git commit -m "feat: add hospitality operator guidance"
```

## Task 6: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
node --test backend/tests/hospitalityIntelligence.test.js backend/tests/hospitalityIntelligenceRoutes.test.js src/components/Marketplace/hospitalityIntelligenceState.test.js
```

Expected: all tests pass.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: Vite build completes without errors.

- [ ] **Step 3: Inspect git status**

Run:

```bash
git status --short
```

Expected: only intended changed files are staged or committed; unrelated local images and `nexus job posting.jpeg` deletion remain untouched.

- [ ] **Step 4: Push to main if requested**

Only if the user asks to push after review:

```bash
git push origin main
```

Expected: push succeeds.
