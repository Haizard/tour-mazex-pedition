# Restaurants V1 AI-Native Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first AI-native `Restaurants` marketplace slice with a canonical restaurant entity, public restaurant discovery/detail, tenant-admin restaurant management, AI concierge guidance, and both direct-inquiry and add-to-itinerary conversion paths.

**Architecture:** Reuse the completed Hotels architecture instead of inventing a separate dining stack. Introduce a canonical `Restaurant` entity in MongoDB as the live write model, mirror it into normalized PostgreSQL restaurant records, and plug restaurant intent into the existing inquiry, quote, revenue, trust, and AI systems.

**Tech Stack:** React, React Router, Express, MongoDB/Mongoose, PostgreSQL business-truth records, pgvector-ready retrieval helpers, Node test runner, existing AI inquiry and marketplace infrastructure.

---

## File Structure

### New backend files

- Create: `backend/models/Restaurant.js`
  - canonical restaurant entity with cuisine, dietary, ambiance, hours, trust, publish, and sponsorship fields
- Create: `backend/utils/postgresRestaurantRecords.js`
  - PostgreSQL sync, lookup, delete, and view builders for `restaurant_records`
- Create: `backend/utils/postgresFirstRestaurantService.js`
  - postgres-first create/update helpers matching hotel/accommodation patterns
- Create: `backend/utils/restaurantMarketplace.js`
  - public discovery/detail shaping, trust summary helpers, and intent payload helpers
- Create: `backend/utils/restaurantAiConcierge.js`
  - deterministic, grounded dining-fit recommendation helpers
- Create: `backend/routes/restaurantRoutes.js`
  - public marketplace endpoints and tenant-admin CRUD
- Create: `backend/tests/postgresRestaurantRecords.test.js`
- Create: `backend/tests/restaurantMarketplace.test.js`
- Create: `backend/tests/restaurantRoutes.test.js`
- Create: `backend/tests/restaurantAiConcierge.test.js`

### Backend files to modify

- Modify: `backend/server.js`
  - register restaurant routes
- Modify: `backend/utils/postgresPrimaryReads.js`
  - add restaurant primary-read normalization
- Modify: `backend/routes/customInquiryRoutes.js`
  - preserve `restaurantId`, `restaurantName`, and `restaurantIntentType` through inquiry creation if not already generic enough
- Modify: `backend/utils/chatSalesAssistant.js`
  - add restaurant-specific lead classification and next-action hints using existing sales assistant structure

### New frontend files

- Create: `src/pages/RestaurantDiscovery.jsx`
  - public restaurant discovery page
- Create: `src/pages/RestaurantDetail.jsx`
  - public restaurant detail page
- Create: `src/pages/restaurantDiscoveryUtils.js`
  - filtering, sorting, and intent helpers
- Create: `src/pages/restaurantDiscoveryUtils.test.js`
- Create: `src/components/Admin/RestaurantManager.jsx`
  - tenant-admin restaurant CRUD and marketplace controls
- Create: `src/components/Admin/restaurantManagerState.js`
  - admin state normalization helpers
- Create: `src/components/Admin/restaurantManagerState.test.js`
- Create: `src/components/Marketplace/RestaurantAiConciergeCard.jsx`
  - visible traveler dining concierge block
- Create: `src/components/Marketplace/RestaurantDirectInquiryForm.jsx`
  - restaurant-first inquiry form
- Create: `src/components/Marketplace/restaurantTrustUtils.js`
  - traveler-facing dining trust and fit labels
- Create: `src/components/Marketplace/restaurantInquiryUtils.js`
  - payload shaping for direct dining leads
- Create: `src/components/Marketplace/restaurantInquiryUtils.test.js`

### Frontend files to modify

- Modify: `src/services/api.js`
  - add restaurant CRUD, public marketplace, concierge, and conversion helpers
- Modify: `src/AppRoutes.jsx`
  - register discovery and detail routes
- Modify: `src/pages/AdminDashboard.jsx`
  - add restaurant manager tab or manager surface following existing admin patterns
- Modify: `src/components/PlanMyTrip/PlanMyTripWizard.jsx`
  - allow restaurant itinerary intent context to pass through the current planner flow if needed

### Existing references to follow

- Reference: `backend/models/Hotel.js`
- Reference: `backend/routes/hotelRoutes.js`
- Reference: `backend/utils/postgresHotelRecords.js`
- Reference: `backend/utils/postgresFirstHotelService.js`
- Reference: `backend/utils/hotelMarketplace.js`
- Reference: `backend/utils/hotelAiConcierge.js`
- Reference: `src/pages/HotelDiscovery.jsx`
- Reference: `src/pages/HotelDetail.jsx`
- Reference: `src/components/Admin/HotelManager.jsx`
- Reference: `src/components/Marketplace/HotelAiConciergeCard.jsx`
- Reference: `src/components/Marketplace/HotelDirectInquiryForm.jsx`

## Task 1: Canonical Restaurant Entity And Business-Truth Foundation

**Files:**
- Create: `backend/models/Restaurant.js`
- Create: `backend/utils/postgresRestaurantRecords.js`
- Create: `backend/utils/postgresFirstRestaurantService.js`
- Modify: `backend/utils/postgresPrimaryReads.js`
- Test: `backend/tests/postgresRestaurantRecords.test.js`

- [ ] **Step 1: Write the failing record tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRestaurantRecordView,
  buildRestaurantRecord,
} from "../utils/postgresRestaurantRecords.js";

test("buildRestaurantRecord keeps cuisine and dietary fields", () => {
  const record = buildRestaurantRecord({
    _id: "restaurant-1",
    tenantId: "tenant-1",
    name: "Kilimanjaro Flame Grill",
    cuisineTypes: ["tanzanian", "grill"],
    dietaryFits: ["vegetarian"],
  });

  assert.equal(record.sourceId, "restaurant-1");
  assert.deepEqual(record.cuisineTypes, ["tanzanian", "grill"]);
  assert.deepEqual(record.dietaryFits, ["vegetarian"]);
});

test("buildRestaurantRecordView reconstructs a restaurant payload", () => {
  const view = buildRestaurantRecordView({
    source_id: "restaurant-1",
    tenant_id: "tenant-1",
    name: "Kilimanjaro Flame Grill",
    cuisine_types: ["tanzanian", "grill"],
    meal_types: ["dinner"],
    dietary_fits: ["vegetarian"],
  });

  assert.equal(view._id, "restaurant-1");
  assert.deepEqual(view.cuisineTypes, ["tanzanian", "grill"]);
  assert.deepEqual(view.mealTypes, ["dinner"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/postgresRestaurantRecords.test.js`
Expected: FAIL because restaurant record helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
// backend/models/Restaurant.js
import mongoose from "mongoose";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const restaurantSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    partnerAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "PartnerAccount", default: null },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    summary: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    destination: { type: String, trim: true, default: "" },
    region: { type: String, trim: true, default: "" },
    geo: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    cuisineTypes: { type: [String], default: [] },
    mealTypes: { type: [String], default: [] },
    dietaryFits: { type: [String], default: [] },
    ambianceTags: { type: [String], default: [] },
    openingHoursSummary: { type: String, trim: true, default: "" },
    reservationStyleSummary: { type: String, trim: true, default: "" },
    photos: { type: [String], default: [] },
    averageRating: { type: Number, min: 0, max: 5, default: null },
    reviewCount: { type: Number, min: 0, default: 0 },
    trustSummary: { type: String, trim: true, default: "" },
    published: { type: Boolean, default: false },
    marketplaceVisible: { type: Boolean, default: false },
    sponsoredPlacement: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "active", "inactive"], default: "draft" },
    sourceMeta: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    businessTruth: {
      type: new mongoose.Schema(
        createBusinessTruthMetadataSchemaDefinition({ entityKey: "restaurants" }),
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

restaurantSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

const Restaurant = mongoose.models.Restaurant || mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
```

- [ ] **Step 4: Add PostgreSQL record helpers**

```js
// backend/utils/postgresRestaurantRecords.js
export const buildRestaurantRecord = (restaurant = {}) => ({
  sourceId: String(restaurant._id || ""),
  tenantId: String(restaurant.tenantId || ""),
  partnerAccountId: restaurant.partnerAccountId ? String(restaurant.partnerAccountId) : "",
  name: restaurant.name || "",
  slug: restaurant.slug || "",
  summary: restaurant.summary || "",
  description: restaurant.description || "",
  destination: restaurant.destination || "",
  region: restaurant.region || "",
  latitude: restaurant.geo?.latitude ?? null,
  longitude: restaurant.geo?.longitude ?? null,
  cuisineTypes: Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes : [],
  mealTypes: Array.isArray(restaurant.mealTypes) ? restaurant.mealTypes : [],
  dietaryFits: Array.isArray(restaurant.dietaryFits) ? restaurant.dietaryFits : [],
  ambianceTags: Array.isArray(restaurant.ambianceTags) ? restaurant.ambianceTags : [],
  openingHoursSummary: restaurant.openingHoursSummary || "",
  reservationStyleSummary: restaurant.reservationStyleSummary || "",
  photos: Array.isArray(restaurant.photos) ? restaurant.photos : [],
  averageRating: restaurant.averageRating ?? null,
  reviewCount: Number(restaurant.reviewCount || 0),
  trustSummary: restaurant.trustSummary || "",
  published: restaurant.published === true,
  marketplaceVisible: restaurant.marketplaceVisible === true,
  sponsoredPlacement: restaurant.sponsoredPlacement === true,
  status: restaurant.status || "draft",
  sourcePayload: restaurant,
});
```

- [ ] **Step 5: Extend primary-read normalization**

```js
// backend/utils/postgresPrimaryReads.js
export const normalizePrimaryRestaurantRows = (rows = []) =>
  rows.map((row = {}) => ({
    ...(row.source_payload || {}),
    _id: String(row.source_id || ""),
    tenantId: String(row.tenant_id || ""),
    partnerAccountId: row.partner_account_id ? String(row.partner_account_id) : "",
    name: String(row.name || ""),
    slug: String(row.slug || ""),
    cuisineTypes: Array.isArray(row.cuisine_types) ? row.cuisine_types : [],
    mealTypes: Array.isArray(row.meal_types) ? row.meal_types : [],
    dietaryFits: Array.isArray(row.dietary_fits) ? row.dietary_fits : [],
    ambianceTags: Array.isArray(row.ambiance_tags) ? row.ambiance_tags : [],
  }));
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test backend/tests/postgresRestaurantRecords.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/models/Restaurant.js backend/utils/postgresRestaurantRecords.js backend/utils/postgresFirstRestaurantService.js backend/utils/postgresPrimaryReads.js backend/tests/postgresRestaurantRecords.test.js
git commit -m "feat: add restaurant entity foundation"
```

## Task 2: Tenant/Admin Restaurant Management And Public Route Wiring

**Files:**
- Create: `backend/routes/restaurantRoutes.js`
- Modify: `backend/server.js`
- Create: `src/components/Admin/RestaurantManager.jsx`
- Create: `src/components/Admin/restaurantManagerState.js`
- Modify: `src/services/api.js`
- Modify: `src/pages/AdminDashboard.jsx`
- Test: `backend/tests/restaurantRoutes.test.js`
- Test: `src/components/Admin/restaurantManagerState.test.js`

- [ ] **Step 1: Write the failing route and admin-state tests**

```js
import test from "node:test";
import assert from "node:assert/strict";

test("restaurant routes expose public and tenant-admin endpoints", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8")
  );

  assert.equal(source.includes('router.get("/public"'), true);
  assert.equal(source.includes('router.get("/public/:slug"'), true);
  assert.equal(source.includes("router.use(requireTenantAdmin)"), true);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test backend/tests/restaurantRoutes.test.js src/components/Admin/restaurantManagerState.test.js`
Expected: FAIL because routes and state helpers do not exist yet.

- [ ] **Step 3: Implement CRUD and public routes**

```js
// backend/routes/restaurantRoutes.js
router.get("/public", async (req, res) => {
  const restaurants = await Restaurant.find(buildRestaurantDiscoveryQuery(req.query))
    .sort(buildRestaurantSort(req.query.sort))
    .populate("tenantId", "name slug")
    .lean();
  res.status(200).json({ restaurants: restaurants.map(shapeRestaurantDiscoveryCard) });
});

router.get("/public/:slug", async (req, res) => {
  const restaurant = await Restaurant.findOne({
    slug: req.params.slug,
    published: true,
    marketplaceVisible: true,
  })
    .populate("tenantId", "name slug")
    .lean();
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found in marketplace." });
  res.status(200).json(shapeRestaurantDetail(restaurant));
});

router.use(requireTenantAdmin);
router.get("/", async (req, res) => {
  const restaurants = await Restaurant.find(buildTenantFilter(req)).sort({ sponsoredPlacement: -1, name: 1 }).lean();
  res.status(200).json(restaurants);
});
```

- [ ] **Step 4: Register route and API helpers**

Run these edits:

```js
// backend/server.js
import restaurantRoutes from "./routes/restaurantRoutes.js";
app.use("/api/restaurants", restaurantRoutes);
```

```js
// src/services/api.js
export const fetchRestaurants = () => cachedGet("/restaurants");
export const createRestaurant = (data) => API.post("/restaurants", data);
export const updateRestaurant = (id, data) => API.patch(`/restaurants/${id}`, data);
export const deleteRestaurant = (id) => API.delete(`/restaurants/${id}`);
export const fetchPublicRestaurants = (params = {}) => cachedGet("/restaurants/public", { params });
export const fetchPublicRestaurantBySlug = (slug) =>
  cachedGet(`/restaurants/public/${encodeURIComponent(slug)}`);
```

- [ ] **Step 5: Build the admin manager**

```js
// src/components/Admin/restaurantManagerState.js
export const createEmptyRestaurantDraft = () => ({
  name: "",
  slug: "",
  summary: "",
  description: "",
  destination: "",
  region: "",
  cuisineTypes: "",
  mealTypes: "",
  dietaryFits: "",
  ambianceTags: "",
  openingHoursSummary: "",
  reservationStyleSummary: "",
  photos: "",
  trustSummary: "",
  averageRating: "",
  reviewCount: 0,
  published: false,
  marketplaceVisible: false,
  sponsoredPlacement: false,
  status: "draft",
});
```

- [ ] **Step 6: Run tests to verify pass**

Run: `node --test backend/tests/restaurantRoutes.test.js src/components/Admin/restaurantManagerState.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/routes/restaurantRoutes.js backend/server.js src/services/api.js src/components/Admin/RestaurantManager.jsx src/components/Admin/restaurantManagerState.js backend/tests/restaurantRoutes.test.js src/components/Admin/restaurantManagerState.test.js src/pages/AdminDashboard.jsx
git commit -m "feat: add restaurant admin and public route wiring"
```

## Task 3: Public Restaurant Discovery, Detail, And Trust Layer

**Files:**
- Create: `backend/utils/restaurantMarketplace.js`
- Create: `backend/tests/restaurantMarketplace.test.js`
- Create: `src/pages/RestaurantDiscovery.jsx`
- Create: `src/pages/RestaurantDetail.jsx`
- Create: `src/pages/restaurantDiscoveryUtils.js`
- Create: `src/pages/restaurantDiscoveryUtils.test.js`
- Create: `src/components/Marketplace/restaurantTrustUtils.js`

- [ ] **Step 1: Write the failing marketplace shaping tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { shapeRestaurantDiscoveryCard } from "../utils/restaurantMarketplace.js";

test("shapeRestaurantDiscoveryCard includes dining fit tags", () => {
  const card = shapeRestaurantDiscoveryCard({
    _id: "restaurant-1",
    name: "Stone Town Spice Table",
    destination: "Zanzibar",
    cuisineTypes: ["swahili", "seafood"],
    dietaryFits: ["vegetarian"],
    ambianceTags: ["romantic"],
  });

  assert.equal(card.name, "Stone Town Spice Table");
  assert.deepEqual(card.fitTags, ["Swahili", "Seafood", "Vegetarian", "Romantic"]);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test backend/tests/restaurantMarketplace.test.js src/pages/restaurantDiscoveryUtils.test.js`
Expected: FAIL because restaurant marketplace helpers do not exist yet.

- [ ] **Step 3: Implement shaping and trust helpers**

```js
// backend/utils/restaurantMarketplace.js
export const getRestaurantFitTags = (restaurant = {}) =>
  [
    ...(Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes : []),
    ...(Array.isArray(restaurant.dietaryFits) ? restaurant.dietaryFits : []),
    ...(Array.isArray(restaurant.ambianceTags) ? restaurant.ambianceTags : []),
  ]
    .filter(Boolean)
    .slice(0, 4)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1));
```

- [ ] **Step 4: Build discovery and detail pages**

Use the same page shape pattern as Hotels:

```js
// src/pages/RestaurantDiscovery.jsx
const RestaurantDiscovery = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState({ q: "", destination: "", cuisine: "", dietary: "", sort: "featured" });
  // fetchPublicRestaurants(filters)
};
```

```js
// src/pages/RestaurantDetail.jsx
const RestaurantDetail = () => {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  // fetchPublicRestaurantBySlug(slug)
};
```

- [ ] **Step 5: Run tests to verify pass**

Run: `node --test backend/tests/restaurantMarketplace.test.js src/pages/restaurantDiscoveryUtils.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/utils/restaurantMarketplace.js backend/tests/restaurantMarketplace.test.js src/pages/RestaurantDiscovery.jsx src/pages/RestaurantDetail.jsx src/pages/restaurantDiscoveryUtils.js src/pages/restaurantDiscoveryUtils.test.js src/components/Marketplace/restaurantTrustUtils.js src/AppRoutes.jsx
git commit -m "feat: add restaurant discovery and detail pages"
```

## Task 4: AI Concierge And Dual Conversion Paths

**Files:**
- Create: `backend/utils/restaurantAiConcierge.js`
- Create: `backend/tests/restaurantAiConcierge.test.js`
- Create: `src/components/Marketplace/RestaurantAiConciergeCard.jsx`
- Create: `src/components/Marketplace/RestaurantDirectInquiryForm.jsx`
- Create: `src/components/Marketplace/restaurantInquiryUtils.js`
- Create: `src/components/Marketplace/restaurantInquiryUtils.test.js`
- Modify: `backend/routes/restaurantRoutes.js`
- Modify: `backend/routes/customInquiryRoutes.js`
- Modify: `backend/utils/chatSalesAssistant.js`
- Modify: `src/pages/RestaurantDetail.jsx`
- Modify: `src/components/PlanMyTrip/PlanMyTripWizard.jsx`

- [ ] **Step 1: Write the failing AI and inquiry payload tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildRestaurantDirectInquirySubmission } from "../../src/components/Marketplace/restaurantInquiryUtils.js";

test("buildRestaurantDirectInquirySubmission keeps restaurant intent metadata", () => {
  const payload = buildRestaurantDirectInquirySubmission({
    restaurant: { _id: "restaurant-1", name: "Spice Table", operator: { id: "tenant-1", slug: "maz-demo" } },
    traveler: { firstName: "Asha", email: "asha@example.com", message: "Need a vegetarian dinner." },
  });

  assert.equal(payload.restaurantId, "restaurant-1");
  assert.equal(payload.restaurantIntentType, "direct-dining");
  assert.equal(payload.sourceChannel, "global-marketplace");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test backend/tests/restaurantAiConcierge.test.js src/components/Marketplace/restaurantInquiryUtils.test.js`
Expected: FAIL because restaurant concierge and inquiry helpers do not exist yet.

- [ ] **Step 3: Implement concierge helpers and public endpoint**

```js
// backend/routes/restaurantRoutes.js
router.post("/public/concierge/recommendations", async (req, res) => {
  const restaurants = await Restaurant.find(buildRestaurantDiscoveryQuery({}))
    .sort(buildRestaurantSort("featured"))
    .lean();
  const recommendations = buildRestaurantConciergeRecommendations(restaurants, req.body);
  res.status(200).json({ recommendations });
});
```

- [ ] **Step 4: Implement direct inquiry and itinerary handoff**

```js
// src/components/Marketplace/restaurantInquiryUtils.js
export const buildRestaurantDirectInquirySubmission = ({ restaurant = {}, traveler = {} } = {}) => ({
  firstName: traveler.firstName || "",
  lastName: traveler.lastName || "",
  email: traveler.email || "",
  phone: traveler.phone || "",
  message: traveler.message || "",
  destinations: restaurant.destination ? [restaurant.destination] : ["Flexible"],
  restaurantId: String(restaurant._id || restaurant.id || ""),
  restaurantName: restaurant.name || "",
  restaurantIntentType: "direct-dining",
  sourceChannel: "global-marketplace",
  campaignLabel: `restaurant_${restaurant._id || restaurant.id || "unknown"}`,
  operatorTenantId: restaurant.operator?.id || "",
  operatorTenantSlug: restaurant.operator?.slug || "",
});
```

- [ ] **Step 5: Surface both CTAs on detail**

```js
// src/pages/RestaurantDetail.jsx
// Direct dining => RestaurantDirectInquiryForm
// Itinerary dining => PlanMyTripWizard with restaurantId, restaurantName, restaurantIntentType
```

- [ ] **Step 6: Extend AI sales hints**

```js
// backend/utils/chatSalesAssistant.js
if (context.restaurantName) {
  quickActions.push("Recommend best dining fit");
  leadCapturePrompt = "Would you like this restaurant on its own or inside a wider itinerary?";
}
```

- [ ] **Step 7: Run tests to verify pass**

Run: `node --test backend/tests/restaurantAiConcierge.test.js src/components/Marketplace/restaurantInquiryUtils.test.js`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/utils/restaurantAiConcierge.js backend/tests/restaurantAiConcierge.test.js src/components/Marketplace/RestaurantAiConciergeCard.jsx src/components/Marketplace/RestaurantDirectInquiryForm.jsx src/components/Marketplace/restaurantInquiryUtils.js src/components/Marketplace/restaurantInquiryUtils.test.js backend/routes/restaurantRoutes.js backend/routes/customInquiryRoutes.js backend/utils/chatSalesAssistant.js src/pages/RestaurantDetail.jsx src/components/PlanMyTrip/PlanMyTripWizard.jsx
git commit -m "feat: add restaurant ai concierge and conversion flows"
```

## Task 5: Full Restaurants V1 Verification

**Files:**
- Verify: `backend/tests/postgresRestaurantRecords.test.js`
- Verify: `backend/tests/restaurantMarketplace.test.js`
- Verify: `backend/tests/restaurantRoutes.test.js`
- Verify: `backend/tests/restaurantAiConcierge.test.js`
- Verify: `src/components/Admin/restaurantManagerState.test.js`
- Verify: `src/pages/restaurantDiscoveryUtils.test.js`
- Verify: `src/components/Marketplace/restaurantInquiryUtils.test.js`
- Verify: `src/services/api.js`

- [ ] **Step 1: Run the full targeted restaurant suite**

Run:

```bash
node --test backend/tests/postgresRestaurantRecords.test.js backend/tests/restaurantMarketplace.test.js backend/tests/restaurantRoutes.test.js backend/tests/restaurantAiConcierge.test.js src/components/Admin/restaurantManagerState.test.js src/pages/restaurantDiscoveryUtils.test.js src/components/Marketplace/restaurantInquiryUtils.test.js
```

Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Vite client build, SSR build, and prerender all succeed.

- [ ] **Step 3: Commit verification cleanup**

```bash
git add backend/tests/postgresRestaurantRecords.test.js backend/tests/restaurantMarketplace.test.js backend/tests/restaurantRoutes.test.js backend/tests/restaurantAiConcierge.test.js src/components/Admin/restaurantManagerState.test.js src/pages/restaurantDiscoveryUtils.test.js src/components/Marketplace/restaurantInquiryUtils.test.js src/services/api.js
git commit -m "test: verify restaurant marketplace rollout"
```

## Verification Commands

Run these during execution as each slice lands:

```bash
node --test backend/tests/postgresRestaurantRecords.test.js
node --test backend/tests/restaurantRoutes.test.js src/components/Admin/restaurantManagerState.test.js
node --test backend/tests/restaurantMarketplace.test.js src/pages/restaurantDiscoveryUtils.test.js
node --test backend/tests/restaurantAiConcierge.test.js src/components/Marketplace/restaurantInquiryUtils.test.js
node --test backend/tests/postgresRestaurantRecords.test.js backend/tests/restaurantMarketplace.test.js backend/tests/restaurantRoutes.test.js backend/tests/restaurantAiConcierge.test.js src/components/Admin/restaurantManagerState.test.js src/pages/restaurantDiscoveryUtils.test.js src/components/Marketplace/restaurantInquiryUtils.test.js
npm run build
```

## Spec Coverage Self-Check

- Canonical `Restaurant` entity: covered in Task 1
- Mongo + PostgreSQL business-truth pattern: covered in Task 1
- Public discovery/detail: covered in Task 3
- Tenant-admin management: covered in Task 2
- AI concierge: covered in Task 4
- Direct inquiry + add-to-itinerary: covered in Task 4
- Sponsored placement and visibility controls: covered in Tasks 1 and 2
- Inquiry / revenue attribution alignment: covered in Task 4
- No table-reservation engine or payment checkout in V1: intentionally excluded from all tasks
