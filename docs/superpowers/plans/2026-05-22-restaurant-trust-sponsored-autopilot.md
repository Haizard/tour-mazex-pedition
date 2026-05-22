# Restaurant Trust, Sponsored Analytics, And Operator Autopilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen the existing restaurant marketplace so public restaurant pages feel more trustworthy, sponsored placement becomes measurable, and restaurant-origin leads gain AI autopilot guidance for operators.

**Architecture:** Build directly on the shipped Restaurants V1 foundation instead of introducing parallel restaurant systems. Keep public trust shaping in restaurant-specific marketplace helpers, keep sponsored analytics as a restaurant rollup utility sourced from existing inquiry and quote data, and surface restaurant autopilot metadata through existing inquiry and lead inbox workflows.

**Tech Stack:** React, React Router, Express, MongoDB/Mongoose, existing PostgreSQL business-truth utilities, Node test runner, existing lead automation and marketplace inquiry infrastructure.

---

## File Structure

### New backend files

- Create: `backend/utils/restaurantAnalytics.js`
  - restaurant analytics rollups, direct vs itinerary counts, sponsored performance, and demand scoring
- Create: `backend/utils/restaurantLeadAutopilot.js`
  - restaurant-specific lead classification, urgency hints, next-best action, and reply guidance
- Create: `backend/tests/restaurantAnalytics.test.js`
- Create: `backend/tests/restaurantLeadAutopilot.test.js`

### Backend files to modify

- Modify: `backend/routes/restaurantRoutes.js`
  - add analytics endpoint(s) for restaurant manager and keep public trust shaping grounded
- Modify: `backend/routes/customInquiryRoutes.js`
  - enrich restaurant-origin inquiry automation with restaurant autopilot metadata
- Modify: `backend/utils/restaurantMarketplace.js`
  - expand discovery/detail trust shaping and dining reassurance copy
- Modify: `backend/utils/chatSalesAssistant.js`
  - incorporate restaurant autopilot hints more explicitly where restaurant recommendations already fit
- Modify: `backend/models/CustomInquiry.js`
  - persist restaurant autopilot metadata if needed in a lightweight field or nested object

### New frontend files

- Create: `src/components/Admin/restaurantAnalyticsState.js`
  - transforms analytics payload into restaurant manager summary cards and spotlight rows
- Create: `src/components/Admin/restaurantAnalyticsState.test.js`
- Create: `src/components/Admin/restaurantAutopilotState.js`
  - restaurant lead autopilot labels and presentation helpers for inbox and manager UI
- Create: `src/components/Admin/restaurantAutopilotState.test.js`

### Frontend files to modify

- Modify: `src/components/Admin/RestaurantManager.jsx`
  - add summary strip, per-restaurant performance metrics, and sponsored spotlight
- Modify: `src/pages/RestaurantDiscovery.jsx`
  - deepen public trust chips and sponsored transparency
- Modify: `src/pages/RestaurantDetail.jsx`
  - add operator credibility block and dining reassurance module
- Modify: `src/components/Marketplace/restaurantTrustUtils.js`
  - centralize richer trust/explanation labels
- Modify: `src/components/Admin/LeadInboxManager.jsx`
  - surface restaurant-specific autopilot context on inquiry cards
- Modify: `src/services/api.js`
  - add fetch helper for restaurant analytics

### Existing references to follow

- Reference: `backend/utils/hotelAnalytics.js`
- Reference: `backend/utils/hotelMarketplace.js`
- Reference: `backend/utils/leadAutomation.js`
- Reference: `src/components/Admin/MarketplaceOperationsOverview.jsx`
- Reference: `src/components/Admin/MarketplaceAvailability/AvailabilitySummaryStrip.jsx`
- Reference: `src/components/Admin/leadInboxFilters.js`
- Reference: `src/components/Marketplace/hotelTrustUtils.js`

## Task 1: Restaurant Analytics Rollups And Sponsored Performance

**Files:**
- Create: `backend/utils/restaurantAnalytics.js`
- Create: `backend/tests/restaurantAnalytics.test.js`
- Modify: `backend/routes/restaurantRoutes.js`
- Modify: `src/services/api.js`

- [ ] **Step 1: Write the failing analytics tests**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantAnalyticsSnapshot,
  scoreRestaurantDemand,
} from "../utils/restaurantAnalytics.js";

test("scoreRestaurantDemand rewards direct and itinerary leads differently", () => {
  const score = scoreRestaurantDemand({
    inquiryCount: 6,
    directInquiryCount: 4,
    itineraryInquiryCount: 2,
    acceptedQuoteCount: 1,
  });

  assert.equal(typeof score, "number");
  assert.equal(score > 0, true);
});

test("buildRestaurantAnalyticsSnapshot summarizes sponsored and public restaurants", () => {
  const snapshot = buildRestaurantAnalyticsSnapshot({
    restaurants: [
      { _id: "restaurant-1", name: "Savanna Table", sponsoredPlacement: true, published: true, marketplaceVisible: true },
      { _id: "restaurant-2", name: "Coast Spice House", sponsoredPlacement: false, published: true, marketplaceVisible: true },
    ],
    inquiries: [
      { restaurantId: "restaurant-1", restaurantIntentType: "direct-restaurant", createdAt: "2026-05-22T00:00:00.000Z" },
      { restaurantId: "restaurant-1", restaurantIntentType: "itinerary-add-on", createdAt: "2026-05-21T00:00:00.000Z" },
    ],
    quoteCountsByRestaurantId: { "restaurant-1": { acceptedQuoteCount: 1 } },
  });

  assert.equal(snapshot.summary.publicRestaurants, 2);
  assert.equal(snapshot.summary.sponsoredRestaurants, 1);
  assert.equal(snapshot.summary.totalRestaurantLeads, 2);
  assert.equal(snapshot.restaurants[0].restaurantId, "restaurant-1");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/restaurantAnalytics.test.js`
Expected: FAIL because the analytics helper does not exist yet.

- [ ] **Step 3: Implement the analytics helper**

```js
// backend/utils/restaurantAnalytics.js
const toIsoOrNull = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const scoreRestaurantDemand = ({
  inquiryCount = 0,
  directInquiryCount = 0,
  itineraryInquiryCount = 0,
  acceptedQuoteCount = 0,
}) =>
  inquiryCount * 3 +
  directInquiryCount * 5 +
  itineraryInquiryCount * 4 +
  acceptedQuoteCount * 8;

export const buildRestaurantAnalyticsSnapshot = ({
  restaurants = [],
  inquiries = [],
  quoteCountsByRestaurantId = {},
}) => {
  const rows = restaurants.map((restaurant = {}) => {
    const restaurantId = String(restaurant._id || "");
    const relatedInquiries = inquiries.filter(
      (inquiry = {}) => String(inquiry.restaurantId || "") === restaurantId
    );
    const directInquiryCount = relatedInquiries.filter(
      (inquiry) => inquiry.restaurantIntentType === "direct-restaurant"
    ).length;
    const itineraryInquiryCount = relatedInquiries.filter(
      (inquiry) => inquiry.restaurantIntentType === "itinerary-add-on"
    ).length;
    const inquiryCount = relatedInquiries.length;
    const acceptedQuoteCount =
      Number(quoteCountsByRestaurantId[restaurantId]?.acceptedQuoteCount || 0);
    const lastInquiryAt = relatedInquiries
      .map((inquiry) => inquiry.createdAt)
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      restaurantId,
      restaurantName: restaurant.name || "",
      destination: restaurant.destination || "",
      sponsoredPlacement: restaurant.sponsoredPlacement === true,
      published: restaurant.published === true,
      marketplaceVisible: restaurant.marketplaceVisible === true,
      inquiryCount,
      directInquiryCount,
      itineraryInquiryCount,
      acceptedQuoteCount,
      lastInquiryAt: toIsoOrNull(lastInquiryAt),
      demandScore: scoreRestaurantDemand({
        inquiryCount,
        directInquiryCount,
        itineraryInquiryCount,
        acceptedQuoteCount,
      }),
    };
  });

  return {
    summary: {
      totalRestaurants: restaurants.length,
      publicRestaurants: restaurants.filter(
        (restaurant) => restaurant.published === true && restaurant.marketplaceVisible === true
      ).length,
      sponsoredRestaurants: restaurants.filter(
        (restaurant) => restaurant.sponsoredPlacement === true
      ).length,
      totalRestaurantLeads: rows.reduce((sum, row) => sum + row.inquiryCount, 0),
      directRestaurantLeads: rows.reduce((sum, row) => sum + row.directInquiryCount, 0),
      itineraryRestaurantLeads: rows.reduce((sum, row) => sum + row.itineraryInquiryCount, 0),
    },
    restaurants: rows.sort(
      (left, right) => right.demandScore - left.demandScore || left.restaurantName.localeCompare(right.restaurantName)
    ),
  };
};
```

- [ ] **Step 4: Extend restaurant routes with analytics endpoint**

```js
// backend/routes/restaurantRoutes.js
import CustomInquiry from "../models/CustomInquiry.js";
import QuoteProposal from "../models/QuoteProposal.js";
import { buildRestaurantAnalyticsSnapshot } from "../utils/restaurantAnalytics.js";

router.get("/analytics", async (req, res) => {
  try {
    const [restaurants, inquiries, quotes] = await Promise.all([
      Restaurant.find(buildTenantFilter(req)).sort({ sponsoredPlacement: -1, name: 1 }).lean(),
      CustomInquiry.find({
        ...buildTenantFilter(req),
        restaurantId: { $ne: null },
      })
        .select("restaurantId restaurantIntentType createdAt")
        .lean(),
      QuoteProposal.find(buildTenantFilter(req))
        .select("status title metadata")
        .lean(),
    ]);

    const acceptedQuoteCounts = quotes.reduce((accumulator, quote = {}) => {
      const restaurantId = String(quote.metadata?.restaurantId || "");
      if (!restaurantId) return accumulator;
      const current = accumulator[restaurantId] || { acceptedQuoteCount: 0 };
      if (String(quote.status || "").toLowerCase() === "accepted") {
        current.acceptedQuoteCount += 1;
      }
      accumulator[restaurantId] = current;
      return accumulator;
    }, {});

    return res.status(200).json(
      buildRestaurantAnalyticsSnapshot({
        restaurants,
        inquiries,
        quoteCountsByRestaurantId: acceptedQuoteCounts,
      })
    );
  } catch (error) {
    return res.status(500).json({
      message: "Failed to build restaurant analytics.",
      error: error.message,
    });
  }
});
```

- [ ] **Step 5: Add the frontend API helper**

```js
// src/services/api.js
export const fetchRestaurantAnalytics = () => cachedGet("/restaurants/analytics");
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test backend/tests/restaurantAnalytics.test.js backend/tests/restaurantRoutes.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/utils/restaurantAnalytics.js backend/tests/restaurantAnalytics.test.js backend/routes/restaurantRoutes.js src/services/api.js
git commit -m "feat: add restaurant sponsored analytics"
```

## Task 2: Public Trust And Dining Reassurance Expansion

**Files:**
- Modify: `backend/utils/restaurantMarketplace.js`
- Modify: `src/components/Marketplace/restaurantTrustUtils.js`
- Modify: `src/pages/RestaurantDiscovery.jsx`
- Modify: `src/pages/RestaurantDetail.jsx`
- Test: `backend/tests/restaurantMarketplace.test.js`
- Test: `src/pages/restaurantDiscoveryUtils.test.js`

- [ ] **Step 1: Extend the failing marketplace tests**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { shapeRestaurantDetail, shapeRestaurantDiscoveryCard } from "../utils/restaurantMarketplace.js";

test("shapeRestaurantDiscoveryCard includes operator credibility and dining context", () => {
  const card = shapeRestaurantDiscoveryCard({
    _id: "restaurant-1",
    name: "Savanna Table",
    cuisineTypes: ["Tanzanian"],
    mealTypes: ["Dinner"],
    ambianceTags: ["Romantic"],
    tenantId: { _id: "tenant-1", name: "Maz Expeditions", slug: "maz-expeditions" },
  });

  assert.equal(card.operator.name, "Maz Expeditions");
  assert.equal(card.trust.operatorLabel.includes("Operator"), true);
  assert.equal(card.diningContextLabel.includes("Dinner"), true);
});

test("shapeRestaurantDetail includes operator credibility and dining reassurance blocks", () => {
  const detail = shapeRestaurantDetail({
    _id: "restaurant-1",
    name: "Savanna Table",
    mealTypes: ["Dinner"],
    dietaryFits: ["Vegetarian"],
    tenantId: { _id: "tenant-1", name: "Maz Expeditions", slug: "maz-expeditions" },
  });

  assert.equal(detail.trustModules.operatorCredibility.title, "Operator credibility");
  assert.equal(detail.trustModules.diningReassurance.items.length > 0, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/restaurantMarketplace.test.js`
Expected: FAIL because the extra trust fields are not shaped yet.

- [ ] **Step 3: Expand restaurant marketplace shaping**

```js
// backend/utils/restaurantMarketplace.js
export const buildRestaurantOperatorLabel = (restaurant = {}) =>
  restaurant.tenantId?.name
    ? `Operator-routed by ${restaurant.tenantId.name}`
    : "Operator-routed dining request";

export const buildRestaurantDiningContextLabel = (restaurant = {}) =>
  [
    ...(Array.isArray(restaurant.mealTypes) ? restaurant.mealTypes.slice(0, 1) : []),
    ...(Array.isArray(restaurant.ambianceTags) ? restaurant.ambianceTags.slice(0, 1) : []),
  ]
    .filter(Boolean)
    .join(" · ");

export const shapeRestaurantDiscoveryCard = (restaurant = {}) => ({
  // existing fields...
  trust: {
    reviewLabel: getRestaurantReviewLabel(restaurant),
    summary: restaurant.trustSummary || "",
    operatorLabel: buildRestaurantOperatorLabel(restaurant),
  },
  diningContextLabel: buildRestaurantDiningContextLabel(restaurant),
});

export const shapeRestaurantDetail = (restaurant = {}) => ({
  // existing fields...
  trustModules: {
    operatorCredibility: {
      title: "Operator credibility",
      body: buildRestaurantOperatorLabel(restaurant),
    },
    diningReassurance: {
      title: "Dining reassurance",
      items: [
        restaurant.openingHoursSummary || "Dining time is confirmed by the operator.",
        restaurant.reservationStyleSummary || "Reservation details are confirmed after inquiry.",
        "AI suggestions are grounded in stored cuisine, timing, and atmosphere fields only.",
      ],
    },
  },
});
```

- [ ] **Step 4: Centralize richer public trust labels**

```js
// src/components/Marketplace/restaurantTrustUtils.js
export const getRestaurantOperatorTrustLabel = (restaurant = {}) =>
  restaurant.trust?.operatorLabel ||
  restaurant.operator?.name
    ? `Operator-managed by ${restaurant.operator?.name || "verified operator"}`
    : "Operator-managed dining listing";

export const getRestaurantDiningReassuranceItems = (restaurant = {}) => [
  restaurant.openingHoursSummary || "Dining hours are confirmed during operator follow-up.",
  restaurant.reservationStyleSummary || "Reservations and menu details are confirmed after inquiry.",
  "AI fit guidance is based only on stored dining fields and does not confirm reservations.",
];
```

- [ ] **Step 5: Update discovery and detail UI**

```jsx
// src/pages/RestaurantDiscovery.jsx
<p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#234232]">
  {restaurant.diningContextLabel || "Dining fit building"}
</p>
<p className="mt-2 text-xs font-semibold text-slate-500">
  {restaurant.trust?.operatorLabel}
</p>

// src/pages/RestaurantDetail.jsx
<div className="mt-8 grid gap-4 md:grid-cols-2">
  <div className="rounded-2xl bg-[#f8f5ee] p-4">
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
      {restaurant.trustModules?.operatorCredibility?.title}
    </p>
    <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
      {restaurant.trustModules?.operatorCredibility?.body}
    </p>
  </div>
  <div className="rounded-2xl bg-[#eef6f0] p-4">
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#234232]">
      {restaurant.trustModules?.diningReassurance?.title}
    </p>
    <ul className="mt-2 space-y-2 text-sm font-medium leading-6 text-slate-600">
      {(restaurant.trustModules?.diningReassurance?.items || []).map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
</div>
```

- [ ] **Step 6: Run tests to verify trust shaping and UI helpers**

Run: `node --test backend/tests/restaurantMarketplace.test.js src/pages/restaurantDiscoveryUtils.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/utils/restaurantMarketplace.js src/components/Marketplace/restaurantTrustUtils.js src/pages/RestaurantDiscovery.jsx src/pages/RestaurantDetail.jsx backend/tests/restaurantMarketplace.test.js
git commit -m "feat: deepen restaurant trust and dining reassurance"
```

## Task 3: Restaurant Manager Summary Strip And Sponsored Spotlight

**Files:**
- Create: `src/components/Admin/restaurantAnalyticsState.js`
- Create: `src/components/Admin/restaurantAnalyticsState.test.js`
- Modify: `src/components/Admin/RestaurantManager.jsx`
- Modify: `src/services/api.js`
- Test: `src/components/Admin/restaurantAnalyticsState.test.js`

- [ ] **Step 1: Write the failing analytics state tests**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantAnalyticsCards,
  buildRestaurantSponsoredSpotlight,
} from "./restaurantAnalyticsState.js";

test("buildRestaurantAnalyticsCards maps summary metrics into cards", () => {
  const cards = buildRestaurantAnalyticsCards({
    summary: {
      publicRestaurants: 4,
      sponsoredRestaurants: 2,
      totalRestaurantLeads: 9,
      directRestaurantLeads: 5,
      itineraryRestaurantLeads: 4,
    },
  });

  assert.equal(cards.length >= 4, true);
  assert.equal(cards[0].value, 4);
});

test("buildRestaurantSponsoredSpotlight separates top and low sponsored performers", () => {
  const spotlight = buildRestaurantSponsoredSpotlight([
    { restaurantId: "a", restaurantName: "A", sponsoredPlacement: true, demandScore: 30 },
    { restaurantId: "b", restaurantName: "B", sponsoredPlacement: true, demandScore: 10 },
  ]);

  assert.equal(spotlight.top[0].restaurantName, "A");
  assert.equal(spotlight.watch[0].restaurantName, "B");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/components/Admin/restaurantAnalyticsState.test.js`
Expected: FAIL because the analytics state helper does not exist yet.

- [ ] **Step 3: Implement analytics state helpers**

```js
// src/components/Admin/restaurantAnalyticsState.js
export const buildRestaurantAnalyticsCards = (analytics = {}) => {
  const summary = analytics.summary || {};
  return [
    { label: "Public Restaurants", value: Number(summary.publicRestaurants || 0) },
    { label: "Sponsored Restaurants", value: Number(summary.sponsoredRestaurants || 0) },
    { label: "Restaurant Leads", value: Number(summary.totalRestaurantLeads || 0) },
    { label: "Direct vs Itinerary", value: `${Number(summary.directRestaurantLeads || 0)} / ${Number(summary.itineraryRestaurantLeads || 0)}` },
  ];
};

export const buildRestaurantSponsoredSpotlight = (rows = []) => {
  const sponsoredRows = rows.filter((row) => row.sponsoredPlacement === true);
  const ordered = [...sponsoredRows].sort((left, right) => right.demandScore - left.demandScore);
  return {
    top: ordered.slice(0, 3),
    watch: [...ordered].reverse().slice(0, 3),
  };
};
```

- [ ] **Step 4: Wire analytics into restaurant manager**

```jsx
// src/components/Admin/RestaurantManager.jsx
import { fetchRestaurantAnalytics } from "../../services/api";
import {
  buildRestaurantAnalyticsCards,
  buildRestaurantSponsoredSpotlight,
} from "./restaurantAnalyticsState";

const [analytics, setAnalytics] = useState(null);

const loadRestaurants = async () => {
  setLoading(true);
  try {
    const [response, analyticsResponse] = await Promise.all([
      fetchRestaurants(),
      fetchRestaurantAnalytics().catch(() => ({ data: null })),
    ]);
    setRestaurants(Array.isArray(response.data) ? response.data : []);
    setAnalytics(analyticsResponse.data || null);
  } finally {
    setLoading(false);
  }
};

const analyticsCards = useMemo(
  () => buildRestaurantAnalyticsCards(analytics || {}),
  [analytics]
);
const sponsoredSpotlight = useMemo(
  () => buildRestaurantSponsoredSpotlight(analytics?.restaurants || []),
  [analytics]
);
```

- [ ] **Step 5: Render summary cards and spotlight**

```jsx
<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">
    Restaurant Lead Conversion
  </p>
  <div className="mt-4 grid gap-4 md:grid-cols-4">
    {analyticsCards.map((card) => (
      <div key={card.label} className="rounded-2xl bg-zinc-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{card.label}</p>
        <p className="mt-3 text-3xl font-black tracking-tight text-zinc-950">{card.value}</p>
      </div>
    ))}
  </div>
</div>

<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
  <h3 className="text-lg font-black text-zinc-950">Sponsored spotlight</h3>
  <div className="mt-4 grid gap-4 md:grid-cols-2">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Top sponsored performers</p>
      {(sponsoredSpotlight.top || []).map((row) => (
        <p key={row.restaurantId} className="mt-2 text-sm font-semibold text-zinc-700">
          {row.restaurantName} · Demand {row.demandScore}
        </p>
      ))}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Needs attention</p>
      {(sponsoredSpotlight.watch || []).map((row) => (
        <p key={row.restaurantId} className="mt-2 text-sm font-semibold text-zinc-700">
          {row.restaurantName} · Demand {row.demandScore}
        </p>
      ))}
    </div>
  </div>
</div>
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test src/components/Admin/restaurantAnalyticsState.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/Admin/restaurantAnalyticsState.js src/components/Admin/restaurantAnalyticsState.test.js src/components/Admin/RestaurantManager.jsx
git commit -m "feat: add restaurant sponsored analytics UI"
```

## Task 4: Restaurant Lead Autopilot And Inbox Context

**Files:**
- Create: `backend/utils/restaurantLeadAutopilot.js`
- Create: `backend/tests/restaurantLeadAutopilot.test.js`
- Create: `src/components/Admin/restaurantAutopilotState.js`
- Create: `src/components/Admin/restaurantAutopilotState.test.js`
- Modify: `backend/routes/customInquiryRoutes.js`
- Modify: `backend/models/CustomInquiry.js`
- Modify: `src/components/Admin/LeadInboxManager.jsx`

- [ ] **Step 1: Write the failing autopilot tests**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { buildRestaurantLeadAutopilot } from "../utils/restaurantLeadAutopilot.js";

test("buildRestaurantLeadAutopilot classifies direct dining inquiries", () => {
  const autopilot = buildRestaurantLeadAutopilot({
    restaurantName: "Savanna Table",
    restaurantIntentType: "direct-restaurant",
    message: "I need a farewell dinner for 6 guests with vegetarian options.",
  });

  assert.equal(autopilot.intentLabel, "Direct dining");
  assert.equal(autopilot.requiresHumanReview, false);
  assert.equal(autopilot.replyHints.length > 0, true);
});

test("buildRestaurantLeadAutopilot flags dietary-sensitive leads", () => {
  const autopilot = buildRestaurantLeadAutopilot({
    restaurantIntentType: "itinerary-add-on",
    message: "Please include a restaurant that can handle vegan and nut-free travelers.",
  });

  assert.equal(autopilot.classifications.includes("dietary-sensitive"), true);
  assert.equal(autopilot.nextBestAction.includes("dietary"), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/restaurantLeadAutopilot.test.js`
Expected: FAIL because the autopilot helper does not exist yet.

- [ ] **Step 3: Implement restaurant lead autopilot helper**

```js
// backend/utils/restaurantLeadAutopilot.js
const includesAny = (message = "", phrases = []) =>
  phrases.some((phrase) => String(message || "").toLowerCase().includes(phrase));

export const buildRestaurantLeadAutopilot = (inquiry = {}) => {
  const message = String(inquiry.message || "").toLowerCase();
  const directDining = inquiry.restaurantIntentType === "direct-restaurant";
  const itineraryDining = inquiry.restaurantIntentType === "itinerary-add-on";
  const dietarySensitive = includesAny(message, ["vegetarian", "vegan", "halal", "gluten", "allergy", "nut-free"]);
  const groupRequest = includesAny(message, ["group", "guests", "event", "birthday", "farewell", "dinner for"]);

  const classifications = [
    directDining ? "direct-dining" : "",
    itineraryDining ? "itinerary-dining" : "",
    dietarySensitive ? "dietary-sensitive" : "",
    groupRequest ? "group-dining" : "",
  ].filter(Boolean);

  return {
    intentLabel: directDining ? "Direct dining" : "Itinerary dining",
    classifications,
    urgency: groupRequest ? "hot" : dietarySensitive ? "warm" : "warm",
    requiresHumanReview: false,
    nextBestAction: dietarySensitive
      ? "Confirm dietary requirements and dining timing before proposing the restaurant."
      : itineraryDining
        ? "Confirm route timing and whether this should be included in the wider itinerary."
        : "Confirm dining date, guest count, and preferred meal timing.",
    replyHints: [
      directDining
        ? "Acknowledge the restaurant request directly and confirm dining timing."
        : "Acknowledge that the restaurant can be considered inside the itinerary.",
      dietarySensitive
        ? "Ask for dietary specifics and any allergy severity."
        : "Confirm any group, celebration, or seating preferences.",
    ],
  };
};
```

- [ ] **Step 4: Enrich inquiry creation with restaurant autopilot metadata**

```js
// backend/routes/customInquiryRoutes.js
import { buildRestaurantLeadAutopilot } from "../utils/restaurantLeadAutopilot.js";

const restaurantAutopilot =
  inquiryData.restaurantId || inquiryData.restaurantIntentType
    ? buildRestaurantLeadAutopilot(inquiryData)
    : null;

const newInquiry = await createPostgresFirstTraveler(
  {
    ...inquiryData,
    ...scoring,
    automationSummary: automation.summary,
    followUpMessage: automation.followUpMessage,
    restaurantAutopilot,
    tenantId: inquiryContext.tenantId,
  },
  process.env
);
```

- [ ] **Step 5: Add restaurant autopilot presentation helpers**

```js
// src/components/Admin/restaurantAutopilotState.js
export const getRestaurantAutopilotBadge = (autopilot = {}) =>
  autopilot.intentLabel || "Restaurant lead";

export const getRestaurantAutopilotSummary = (autopilot = {}) => ({
  title: autopilot.intentLabel || "Restaurant lead",
  urgency: autopilot.urgency || "warm",
  nextBestAction: autopilot.nextBestAction || "",
  replyHints: Array.isArray(autopilot.replyHints) ? autopilot.replyHints : [],
});
```

- [ ] **Step 6: Render restaurant autopilot context in lead inbox**

```jsx
// src/components/Admin/LeadInboxManager.jsx
import {
  getRestaurantAutopilotBadge,
  getRestaurantAutopilotSummary,
} from "./restaurantAutopilotState";

const restaurantAutopilot = inquiry.restaurantAutopilot || null;
const restaurantAutopilotSummary = getRestaurantAutopilotSummary(restaurantAutopilot || {});

{restaurantAutopilot ? (
  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
      {getRestaurantAutopilotBadge(restaurantAutopilot)}
    </p>
    <p className="mt-2 text-sm font-semibold text-emerald-950">
      {restaurantAutopilotSummary.nextBestAction}
    </p>
    <ul className="mt-2 space-y-1 text-sm font-medium leading-6 text-emerald-900">
      {restaurantAutopilotSummary.replyHints.map((hint) => (
        <li key={hint}>{hint}</li>
      ))}
    </ul>
  </div>
) : null}
```

- [ ] **Step 7: Run tests to verify it passes**

Run: `node --test backend/tests/restaurantLeadAutopilot.test.js src/components/Admin/restaurantAutopilotState.test.js`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/utils/restaurantLeadAutopilot.js backend/tests/restaurantLeadAutopilot.test.js backend/routes/customInquiryRoutes.js src/components/Admin/restaurantAutopilotState.js src/components/Admin/restaurantAutopilotState.test.js src/components/Admin/LeadInboxManager.jsx
git commit -m "feat: add restaurant operator autopilot guidance"
```

## Task 5: Full Verification

**Files:**
- Verify all modified and new files from Tasks 1-4

- [ ] **Step 1: Run the targeted restaurant deepening test suite**

Run:

```bash
node --test backend/tests/restaurantAnalytics.test.js backend/tests/restaurantLeadAutopilot.test.js backend/tests/restaurantMarketplace.test.js backend/tests/restaurantRoutes.test.js src/components/Admin/restaurantAnalyticsState.test.js src/components/Admin/restaurantAutopilotState.test.js
```

Expected: PASS

- [ ] **Step 2: Re-run the existing restaurant foundation tests**

Run:

```bash
node --test backend/tests/postgresRestaurantRecords.test.js backend/tests/restaurantAiConcierge.test.js src/components/Admin/restaurantManagerState.test.js src/components/Marketplace/restaurantInquiryUtils.test.js src/pages/restaurantDiscoveryUtils.test.js
```

Expected: PASS

- [ ] **Step 3: Run application build verification**

Run:

```bash
npm run build
```

Expected: PASS with only existing bundle-size warnings if any.

- [ ] **Step 4: Commit final verification adjustments if needed**

```bash
git add backend src
git commit -m "test: verify restaurant trust and autopilot phase"
```

## Spec Coverage Self-Check

- Public trust and proof:
  - covered by Task 2 through richer discovery/detail trust shaping and dining reassurance UI
- Sponsored analytics:
  - covered by Task 1 analytics utility and Task 3 manager summary/spotlight UI
- Operator autopilot:
  - covered by Task 4 backend autopilot helper and lead inbox/admin presentation
- Scope boundary:
  - no reservation engine, payment flow, review submission overhaul, or self-claim work included

## Placeholder Scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each code task includes concrete file targets, sample code, commands, and expected outcomes.

## Type Consistency Check

- Restaurant intent values stay consistent with the shipped V1 model:
  - `direct-restaurant`
  - `itinerary-add-on`
- Analytics summary fields stay consistent across backend and frontend:
  - `publicRestaurants`
  - `sponsoredRestaurants`
  - `totalRestaurantLeads`
  - `directRestaurantLeads`
  - `itineraryRestaurantLeads`
