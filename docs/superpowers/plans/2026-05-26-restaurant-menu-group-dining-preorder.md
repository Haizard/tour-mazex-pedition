# Restaurant Menu Group Dining Pre-order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build restaurant-owned menu sections/items, public menu preview, reservation menu-interest capture, and pre-order metadata that supports group/private dining revenue.

**Architecture:** Add restaurant-specific menu models and pure utilities first, then expose public/admin/partner endpoints through the existing restaurant route families. Frontend work uses small state helpers and focused components, then mounts a public menu preview and lightweight menu-interest controls into the existing restaurant detail/reservation flow.

**Tech Stack:** Node.js ESM, Express, Mongoose, existing restaurant routes, React, existing `src/services/api.js`, Node test runner, Vite build.

---

## File Structure

- Create `backend/models/RestaurantMenuSection.js`: restaurant-owned menu section model.
- Create `backend/models/RestaurantMenuItem.js`: restaurant-owned menu item/package model.
- Create `backend/utils/restaurantMenu.js`: pure normalization, preview shaping, reservation interest shaping, and AI/trust copy helpers.
- Create `backend/tests/restaurantMenu.test.js`: utility/model-shape tests.
- Modify `backend/models/RestaurantReservationRequest.js`: add menu-interest snapshot fields.
- Modify `backend/utils/restaurantReservations.js`: normalize and shape menu-interest fields.
- Modify `backend/tests/restaurantReservations.test.js`: reservation payload coverage.
- Modify `backend/routes/restaurantRoutes.js`: public menu preview and tenant-admin menu management endpoints.
- Modify `backend/routes/restaurantPartnerAuthRoutes.js`: partner menu management endpoints.
- Modify `backend/tests/restaurantRoutes.test.js` and `backend/tests/restaurantPartnerRoutes.test.js`: route presence and safety tests.
- Modify `src/services/api.js`: public/admin/partner menu APIs.
- Create `src/components/Marketplace/restaurantMenuState.js`: public menu preview and reservation selection helpers.
- Create `src/components/Marketplace/restaurantMenuState.test.js`: frontend state tests.
- Create `src/components/Marketplace/RestaurantMenuPreview.jsx`: public trust-safe menu preview.
- Modify `src/components/Marketplace/RestaurantReservationWidget.jsx`: optional menu interest/pre-order fields.
- Modify `src/components/Marketplace/restaurantReservationState.js` and test: payload shaping.
- Modify `src/pages/RestaurantDetail.jsx`: fetch and mount menu preview.
- Modify `src/pages/RestaurantPartnerDashboard.jsx`: compact partner menu workspace.
- Do not modify `src/components/Admin/RestaurantManager.jsx` in this V1 plan. Tenant-admin menu management is covered by API endpoints; visible admin UI can be a follow-up after the public and partner menu loops are working.

## Task 1: Restaurant Menu Domain Models And Utilities

**Files:**
- Create: `backend/models/RestaurantMenuSection.js`
- Create: `backend/models/RestaurantMenuItem.js`
- Create: `backend/utils/restaurantMenu.js`
- Test: `backend/tests/restaurantMenu.test.js`

- [ ] **Step 1: Write failing utility tests**

Create `backend/tests/restaurantMenu.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMenuItemSnapshot,
  buildMenuPreorderMetadata,
  buildRestaurantMenuAiSummary,
  normalizeMenuItemPayload,
  normalizeMenuSectionPayload,
  shapePublicRestaurantMenuPreview,
} from "../utils/restaurantMenu.js";

test("normalizes menu sections and items for restaurant-owned menus", () => {
  assert.deepEqual(normalizeMenuSectionPayload({ title: " Group Platters ", displayOrder: "2" }), {
    title: "Group Platters",
    description: "",
    displayOrder: 2,
    status: "active",
  });

  const item = normalizeMenuItemPayload({
    name: "  Safari Sharing Platter ",
    description: "Feeds a small group",
    price: "45",
    currency: "usd",
    dietaryTags: [" Halal ", "", "Vegetarian"],
    allergenTags: [" nuts "],
    featured: true,
    groupFriendly: true,
    preorderEnabled: true,
    minGuests: "4",
    maxGuests: "12",
  });

  assert.equal(item.name, "Safari Sharing Platter");
  assert.equal(item.price, 45);
  assert.equal(item.currency, "USD");
  assert.deepEqual(item.dietaryTags, ["Halal", "Vegetarian"]);
  assert.deepEqual(item.allergenTags, ["nuts"]);
  assert.equal(item.groupFriendly, true);
  assert.equal(item.preorderEnabled, true);
  assert.equal(item.minGuests, 4);
  assert.equal(item.maxGuests, 12);
});

test("shapes public menu preview with trust-safe disclaimer", () => {
  const preview = shapePublicRestaurantMenuPreview({
    sections: [{ _id: "section_1", title: "Mains", status: "active", displayOrder: 1 }],
    items: [
      {
        _id: "item_1",
        sectionId: "section_1",
        name: "Coconut Fish Curry",
        description: "Coastal curry",
        price: 18,
        currency: "USD",
        dietaryTags: ["Gluten aware"],
        available: true,
        featured: true,
        groupFriendly: false,
        preorderEnabled: true,
        status: "active",
      },
      { _id: "hidden", name: "Hidden", available: false, status: "archived" },
    ],
  });

  assert.equal(preview.sections.length, 1);
  assert.equal(preview.items.length, 1);
  assert.equal(preview.featuredItems[0].name, "Coconut Fish Curry");
  assert.equal(preview.disclaimer.includes("confirmed by the restaurant/operator"), true);
});

test("builds reservation menu snapshots and preorder metadata", () => {
  const item = {
    _id: "item_1",
    name: "Private Dining Menu",
    price: 65,
    currency: "USD",
    dietaryTags: ["Vegetarian"],
    allergenTags: ["nuts"],
    preorderEnabled: true,
  };

  assert.deepEqual(buildMenuItemSnapshot(item), {
    itemId: "item_1",
    name: "Private Dining Menu",
    price: 65,
    currency: "USD",
    dietaryTags: ["Vegetarian"],
    allergenTags: ["nuts"],
    preorderEnabled: true,
  });

  assert.deepEqual(
    buildMenuPreorderMetadata({
      selectedMenuItemIds: ["item_1"],
      groupMealNotes: "Birthday group",
      preorderInterest: true,
    }),
    {
      selectedMenuItemIds: ["item_1"],
      groupMealNotes: "Birthday group",
      preorderInterest: true,
      preorderReason: "group_dining",
    }
  );
});

test("buildRestaurantMenuAiSummary does not fabricate menu facts", () => {
  const summary = buildRestaurantMenuAiSummary({
    items: [{ name: "Vegetarian Pilau", dietaryTags: ["Vegetarian"], groupFriendly: true }],
  });

  assert.equal(summary.highlights.includes("Vegetarian Pilau"), true);
  assert.equal(summary.trustBoundary.includes("does not confirm dish availability"), true);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test backend/tests/restaurantMenu.test.js
```

Expected: FAIL because `backend/utils/restaurantMenu.js` does not exist.

- [ ] **Step 3: Create menu models**

Create `backend/models/RestaurantMenuSection.js`:

```js
import mongoose from "mongoose";

const restaurantMenuSectionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "paused", "archived"], default: "active", index: true },
  },
  { timestamps: true }
);

restaurantMenuSectionSchema.index({ tenantId: 1, restaurantId: 1, displayOrder: 1 });

const RestaurantMenuSection =
  mongoose.models.RestaurantMenuSection ||
  mongoose.model("RestaurantMenuSection", restaurantMenuSectionSchema);

export default RestaurantMenuSection;
```

Create `backend/models/RestaurantMenuItem.js`:

```js
import mongoose from "mongoose";

const restaurantMenuItemSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "RestaurantMenuSection", default: null, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, default: "USD" },
    dietaryTags: { type: [String], default: [] },
    allergenTags: { type: [String], default: [] },
    photo: { type: String, trim: true, default: "" },
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    groupFriendly: { type: Boolean, default: false },
    preorderEnabled: { type: Boolean, default: false },
    minGuests: { type: Number, min: 1, default: 1 },
    maxGuests: { type: Number, min: 1, default: 1 },
    status: { type: String, enum: ["active", "paused", "archived"], default: "active", index: true },
  },
  { timestamps: true }
);

restaurantMenuItemSchema.index({ tenantId: 1, restaurantId: 1, featured: -1, status: 1 });
restaurantMenuItemSchema.index({ tenantId: 1, restaurantId: 1, groupFriendly: -1, status: 1 });

const RestaurantMenuItem =
  mongoose.models.RestaurantMenuItem ||
  mongoose.model("RestaurantMenuItem", restaurantMenuItemSchema);

export default RestaurantMenuItem;
```

- [ ] **Step 4: Implement menu utility**

Create `backend/utils/restaurantMenu.js`:

```js
const RECORD_STATUSES = new Set(["active", "paused", "archived"]);

const toTrimmedString = (value) => String(value || "").trim();
const toStringArray = (value) =>
  Array.isArray(value) ? value.map((item) => toTrimmedString(item)).filter(Boolean) : [];
const toNonNegativeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
const toPositiveInt = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const normalizeStatus = (value) => {
  const status = toTrimmedString(value).toLowerCase();
  return RECORD_STATUSES.has(status) ? status : "active";
};
const toId = (value) => String(value?._id || value?.id || value || "");

export const normalizeMenuSectionPayload = (payload = {}) => ({
  title: toTrimmedString(payload.title),
  description: toTrimmedString(payload.description),
  displayOrder: toPositiveInt(payload.displayOrder, 0),
  status: normalizeStatus(payload.status),
});

export const normalizeMenuItemPayload = (payload = {}) => {
  const minGuests = toPositiveInt(payload.minGuests, 1);
  const maxGuests = Math.max(toPositiveInt(payload.maxGuests, minGuests), minGuests);

  return {
    sectionId: payload.sectionId || null,
    name: toTrimmedString(payload.name),
    description: toTrimmedString(payload.description),
    price: toNonNegativeNumber(payload.price, 0),
    currency: toTrimmedString(payload.currency || "USD").toUpperCase(),
    dietaryTags: toStringArray(payload.dietaryTags),
    allergenTags: toStringArray(payload.allergenTags),
    photo: toTrimmedString(payload.photo),
    available: payload.available !== false,
    featured: payload.featured === true,
    groupFriendly: payload.groupFriendly === true,
    preorderEnabled: payload.preorderEnabled === true,
    minGuests,
    maxGuests,
    status: normalizeStatus(payload.status),
  };
};

export const buildMenuItemSnapshot = (item = {}) => ({
  itemId: toId(item),
  name: item.name || "",
  price: toNonNegativeNumber(item.price, 0),
  currency: item.currency || "USD",
  dietaryTags: toStringArray(item.dietaryTags),
  allergenTags: toStringArray(item.allergenTags),
  preorderEnabled: item.preorderEnabled === true,
});

export const buildMenuPreorderMetadata = (payload = {}) => {
  const selectedMenuItemIds = toStringArray(payload.selectedMenuItemIds);
  const groupMealNotes = toTrimmedString(payload.groupMealNotes);
  const preorderInterest = payload.preorderInterest === true;

  return {
    selectedMenuItemIds,
    groupMealNotes,
    preorderInterest,
    preorderReason: preorderInterest || groupMealNotes || selectedMenuItemIds.length
      ? "group_dining"
      : "none",
  };
};

const shapeSection = (section = {}) => ({
  id: toId(section),
  title: section.title || "",
  description: section.description || "",
  displayOrder: Number(section.displayOrder || 0),
});

const shapeItem = (item = {}) => ({
  id: toId(item),
  sectionId: item.sectionId ? String(item.sectionId) : null,
  name: item.name || "",
  description: item.description || "",
  price: toNonNegativeNumber(item.price, 0),
  currency: item.currency || "USD",
  dietaryTags: toStringArray(item.dietaryTags),
  allergenTags: toStringArray(item.allergenTags),
  photo: item.photo || "",
  available: item.available !== false,
  featured: item.featured === true,
  groupFriendly: item.groupFriendly === true,
  preorderEnabled: item.preorderEnabled === true,
  minGuests: toPositiveInt(item.minGuests, 1),
  maxGuests: toPositiveInt(item.maxGuests, 1),
});

export const shapePublicRestaurantMenuPreview = ({ sections = [], items = [] } = {}) => {
  const activeSections = (Array.isArray(sections) ? sections : [])
    .filter((section) => (section.status || "active") === "active")
    .map(shapeSection)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title));

  const activeItems = (Array.isArray(items) ? items : [])
    .filter((item) => (item.status || "active") === "active" && item.available !== false)
    .map(shapeItem)
    .filter((item) => item.id && item.name);

  return {
    sections: activeSections,
    items: activeItems,
    featuredItems: activeItems.filter((item) => item.featured).slice(0, 6),
    groupFriendlyItems: activeItems.filter((item) => item.groupFriendly).slice(0, 6),
    preorderItems: activeItems.filter((item) => item.preorderEnabled).slice(0, 6),
    disclaimer: "Menu availability and final pricing are confirmed by the restaurant/operator.",
  };
};

export const buildRestaurantMenuAiSummary = ({ items = [] } = {}) => {
  const activeItems = (Array.isArray(items) ? items : []).filter((item) => item && item.name);
  const groupItems = activeItems.filter((item) => item.groupFriendly).map((item) => item.name);
  const dietaryTags = [...new Set(activeItems.flatMap((item) => toStringArray(item.dietaryTags)))];

  return {
    highlights: activeItems.slice(0, 4).map((item) => item.name),
    groupDiningFit: groupItems.length
      ? `Group-friendly options include ${groupItems.slice(0, 3).join(", ")}.`
      : "No group-friendly menu items have been marked yet.",
    dietarySummary: dietaryTags.length
      ? `Known dietary tags include ${dietaryTags.slice(0, 5).join(", ")}.`
      : "No dietary tags have been stored yet.",
    trustBoundary:
      "AI guidance uses stored menu fields only and does not confirm dish availability, allergen guarantees, live kitchen capacity, or final pricing.",
  };
};
```

- [ ] **Step 5: Run utility tests**

Run:

```bash
node --test backend/tests/restaurantMenu.test.js
```

Expected: all tests pass.

- [ ] **Step 6: Commit domain foundation**

Run:

```bash
git add backend/models/RestaurantMenuSection.js backend/models/RestaurantMenuItem.js backend/utils/restaurantMenu.js backend/tests/restaurantMenu.test.js
git commit -m "feat: add restaurant menu foundation"
```

## Task 2: Reservation Menu Interest Backend

**Files:**
- Modify: `backend/models/RestaurantReservationRequest.js`
- Modify: `backend/utils/restaurantReservations.js`
- Modify: `backend/tests/restaurantReservations.test.js`

- [ ] **Step 1: Add failing reservation tests**

Append to `backend/tests/restaurantReservations.test.js`:

```js
test("normalizeReservationRequestPayload preserves menu interest", () => {
  const payload = normalizeReservationRequestPayload({
    travelerName: "Amina",
    travelerEmail: "AMINA@example.com",
    date: "2026-06-01",
    preferredTime: "19:00",
    guestCount: 10,
    selectedMenuItemIds: [" item_1 ", "item_2", ""],
    selectedMenuItems: [{ itemId: "item_1", name: "Group Platter", price: 45, currency: "USD" }],
    groupMealNotes: "Birthday group",
    preorderInterest: true,
  });

  assert.deepEqual(payload.selectedMenuItemIds, ["item_1", "item_2"]);
  assert.equal(payload.selectedMenuItems[0].name, "Group Platter");
  assert.equal(payload.groupMealNotes, "Birthday group");
  assert.equal(payload.preorderInterest, true);
});

test("shapeReservationRequest exposes menu interest to partners and admins", () => {
  const shaped = shapeReservationRequest({
    _id: "req_1",
    restaurantId: "restaurant_1",
    travelerName: "Amina",
    travelerEmail: "amina@example.com",
    date: "2026-06-01",
    preferredTime: "19:00",
    guestCount: 10,
    selectedMenuItemIds: ["item_1"],
    selectedMenuItems: [{ itemId: "item_1", name: "Group Platter" }],
    groupMealNotes: "Birthday group",
    preorderInterest: true,
  });

  assert.deepEqual(shaped.selectedMenuItemIds, ["item_1"]);
  assert.equal(shaped.selectedMenuItems[0].name, "Group Platter");
  assert.equal(shaped.groupMealNotes, "Birthday group");
  assert.equal(shaped.preorderInterest, true);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
node --test backend/tests/restaurantReservations.test.js
```

Expected: FAIL because menu-interest fields are not normalized/shaped yet.

- [ ] **Step 3: Extend reservation schema**

Add these fields before `publicNotes` in `backend/models/RestaurantReservationRequest.js`:

```js
    selectedMenuItemIds: { type: [String], default: [] },
    selectedMenuItems: { type: [mongoose.Schema.Types.Mixed], default: [] },
    groupMealNotes: { type: String, trim: true, default: "" },
    preorderInterest: { type: Boolean, default: false },
```

- [ ] **Step 4: Extend reservation utility**

In `backend/utils/restaurantReservations.js`, add helper:

```js
const toStringArray = (value) =>
  Array.isArray(value) ? value.map((item) => toTrimmedString(item)).filter(Boolean) : [];
```

Add to `normalizeReservationRequestPayload` return object:

```js
  selectedMenuItemIds: toStringArray(payload.selectedMenuItemIds),
  selectedMenuItems: Array.isArray(payload.selectedMenuItems)
    ? payload.selectedMenuItems.filter((item) => item && typeof item === "object")
    : [],
  groupMealNotes: toTrimmedString(payload.groupMealNotes),
  preorderInterest: payload.preorderInterest === true,
```

Add to `shapeReservationRequest`:

```js
  selectedMenuItemIds: toStringArray(request.selectedMenuItemIds),
  selectedMenuItems: Array.isArray(request.selectedMenuItems) ? request.selectedMenuItems : [],
  groupMealNotes: request.groupMealNotes || "",
  preorderInterest: request.preorderInterest === true,
```

- [ ] **Step 5: Run reservation tests**

Run:

```bash
node --test backend/tests/restaurantReservations.test.js
```

Expected: all tests pass.

- [ ] **Step 6: Commit reservation menu interest**

Run:

```bash
git add backend/models/RestaurantReservationRequest.js backend/utils/restaurantReservations.js backend/tests/restaurantReservations.test.js
git commit -m "feat: add restaurant reservation menu interest"
```

## Task 3: Restaurant Menu API Routes

**Files:**
- Modify: `backend/routes/restaurantRoutes.js`
- Modify: `backend/routes/restaurantPartnerAuthRoutes.js`
- Modify: `backend/tests/restaurantRoutes.test.js`
- Modify: `backend/tests/restaurantPartnerRoutes.test.js`

- [ ] **Step 1: Add failing route presence tests**

Append to `backend/tests/restaurantRoutes.test.js`:

```js
test("restaurant routes expose public and admin menu endpoints", async () => {
  const source = await fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8");

  assert.equal(source.includes('router.get("/public/:id/menu"'), true);
  assert.equal(source.includes('router.get("/:restaurantId/menu"'), true);
  assert.equal(source.includes('router.post("/:restaurantId/menu/sections"'), true);
  assert.equal(source.includes('router.post("/:restaurantId/menu/items"'), true);
  assert.equal(source.includes("shapePublicRestaurantMenuPreview"), true);
});
```

Append to `backend/tests/restaurantPartnerRoutes.test.js`:

```js
test("restaurant partner routes expose menu management endpoints", async () => {
  const source = await fs.readFile(new URL("../routes/restaurantPartnerAuthRoutes.js", import.meta.url), "utf8");

  assert.equal(source.includes('router.get("/restaurants/:restaurantId/menu"'), true);
  assert.equal(source.includes('router.post("/restaurants/:restaurantId/menu/sections"'), true);
  assert.equal(source.includes('router.post("/restaurants/:restaurantId/menu/items"'), true);
});
```

- [ ] **Step 2: Run route tests to verify failure**

Run:

```bash
node --test backend/tests/restaurantRoutes.test.js backend/tests/restaurantPartnerRoutes.test.js
```

Expected: FAIL because menu endpoints are not exposed yet.

- [ ] **Step 3: Add imports to restaurant routes**

In both `backend/routes/restaurantRoutes.js` and `backend/routes/restaurantPartnerAuthRoutes.js`, import:

```js
import RestaurantMenuSection from "../models/RestaurantMenuSection.js";
import RestaurantMenuItem from "../models/RestaurantMenuItem.js";
import {
  normalizeMenuItemPayload,
  normalizeMenuSectionPayload,
  shapePublicRestaurantMenuPreview,
} from "../utils/restaurantMenu.js";
```

- [ ] **Step 4: Add public menu preview endpoint to `restaurantRoutes.js`**

Add before `router.use(requireTenantAdmin);`:

```js
router.get("/public/:id/menu", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      published: true,
      marketplaceVisible: true,
    })
      .select("_id tenantId")
      .lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found in marketplace." });
    }

    const [sections, items] = await Promise.all([
      RestaurantMenuSection.find({
        tenantId: restaurant.tenantId,
        restaurantId: restaurant._id,
        status: "active",
      })
        .sort({ displayOrder: 1, title: 1 })
        .lean(),
      RestaurantMenuItem.find({
        tenantId: restaurant.tenantId,
        restaurantId: restaurant._id,
        status: "active",
        available: true,
      })
        .sort({ featured: -1, groupFriendly: -1, name: 1 })
        .limit(60)
        .lean(),
    ]);

    return res.status(200).json(shapePublicRestaurantMenuPreview({ sections, items }));
  } catch (error) {
    return res.status(200).json(
      shapePublicRestaurantMenuPreview({ sections: [], items: [] })
    );
  }
});
```

- [ ] **Step 5: Add tenant-admin menu endpoints to `restaurantRoutes.js` after `router.use(requireTenantAdmin);`**

Add:

```js
router.get("/:restaurantId/menu", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne(buildTenantFilter(req, { _id: req.params.restaurantId }))
      .select("_id tenantId")
      .lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    const [sections, items] = await Promise.all([
      RestaurantMenuSection.find(buildTenantFilter(req, { restaurantId: restaurant._id }))
        .sort({ displayOrder: 1, title: 1 })
        .lean(),
      RestaurantMenuItem.find(buildTenantFilter(req, { restaurantId: restaurant._id }))
        .sort({ featured: -1, groupFriendly: -1, name: 1 })
        .lean(),
    ]);

    return res.status(200).json({ sections, items });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch restaurant menu.", error: error.message });
  }
});

router.post("/:restaurantId/menu/sections", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne(buildTenantFilter(req, { _id: req.params.restaurantId }))
      .select("_id tenantId")
      .lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    const payload = normalizeMenuSectionPayload(req.body);
    if (!payload.title) {
      return res.status(400).json({ message: "Menu section title is required." });
    }

    const section = await RestaurantMenuSection.create({
      ...payload,
      tenantId: restaurant.tenantId,
      restaurantId: restaurant._id,
    });

    return res.status(201).json(section);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/:restaurantId/menu/items", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne(buildTenantFilter(req, { _id: req.params.restaurantId }))
      .select("_id tenantId")
      .lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    const payload = normalizeMenuItemPayload(req.body);
    if (!payload.name) {
      return res.status(400).json({ message: "Menu item name is required." });
    }

    const item = await RestaurantMenuItem.create({
      ...payload,
      tenantId: restaurant.tenantId,
      restaurantId: restaurant._id,
    });

    return res.status(201).json(item);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
```

- [ ] **Step 6: Add partner menu endpoints to `restaurantPartnerAuthRoutes.js`**

Add concrete endpoints after the existing `/restaurants/:restaurantId/reservations` route and before service-window mutations:

```js
router.get("/restaurants/:restaurantId/menu", async (req, res) => {
  try {
    assertPartnerRestaurantAccess(req, req.params.restaurantId);
    const query = {
      tenantId: req.tenantId,
      restaurantId: req.params.restaurantId,
    };

    const [sections, items] = await Promise.all([
      RestaurantMenuSection.find(query).sort({ displayOrder: 1, title: 1 }).lean(),
      RestaurantMenuItem.find(query).sort({ featured: -1, groupFriendly: -1, name: 1 }).lean(),
    ]);

    return res.status(200).json({ sections, items });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post("/restaurants/:restaurantId/menu/sections", async (req, res) => {
  try {
    assertPartnerRestaurantAccess(req, req.params.restaurantId);
    const payload = normalizeMenuSectionPayload(req.body);
    if (!payload.title) {
      return res.status(400).json({ message: "Menu section title is required." });
    }

    const section = await RestaurantMenuSection.create({
      ...payload,
      tenantId: req.tenantId,
      restaurantId: req.params.restaurantId,
    });

    return res.status(201).json(section);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.post("/restaurants/:restaurantId/menu/items", async (req, res) => {
  try {
    assertPartnerRestaurantAccess(req, req.params.restaurantId);
    const payload = normalizeMenuItemPayload(req.body);
    if (!payload.name) {
      return res.status(400).json({ message: "Menu item name is required." });
    }

    const item = await RestaurantMenuItem.create({
      ...payload,
      tenantId: req.tenantId,
      restaurantId: req.params.restaurantId,
    });

    return res.status(201).json(item);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});
```

- [ ] **Step 7: Run route tests**

Run:

```bash
node --test backend/tests/restaurantRoutes.test.js backend/tests/restaurantPartnerRoutes.test.js backend/tests/restaurantMenu.test.js
```

Expected: all tests pass.

- [ ] **Step 8: Commit menu API**

Run:

```bash
git add backend/routes/restaurantRoutes.js backend/routes/restaurantPartnerAuthRoutes.js backend/tests/restaurantRoutes.test.js backend/tests/restaurantPartnerRoutes.test.js
git commit -m "feat: expose restaurant menu APIs"
```

## Task 4: Frontend Menu State And Public Preview

**Files:**
- Modify: `src/services/api.js`
- Create: `src/components/Marketplace/restaurantMenuState.js`
- Create: `src/components/Marketplace/restaurantMenuState.test.js`
- Create: `src/components/Marketplace/RestaurantMenuPreview.jsx`
- Modify: `src/pages/RestaurantDetail.jsx`

- [ ] **Step 1: Write failing frontend state tests**

Create `src/components/Marketplace/restaurantMenuState.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMenuSelectionPayload,
  getMenuEmptyState,
  normalizeRestaurantMenuPreview,
} from "./restaurantMenuState.js";

test("normalizes public restaurant menu preview safely", () => {
  const preview = normalizeRestaurantMenuPreview({
    items: [
      { id: "item_1", name: "Coconut Fish Curry", price: 18, currency: "USD", featured: true },
      null,
    ],
    disclaimer: "Menu availability is confirmed by the operator.",
  });

  assert.equal(preview.items.length, 1);
  assert.equal(preview.items[0].priceLabel, "USD 18");
  assert.equal(preview.featuredItems[0].name, "Coconut Fish Curry");
  assert.equal(preview.disclaimer, "Menu availability is confirmed by the operator.");
});

test("buildMenuSelectionPayload shapes reservation menu interest", () => {
  assert.deepEqual(
    buildMenuSelectionPayload({
      selectedMenuItemIds: ["item_1", "", "item_2"],
      groupMealNotes: "Birthday dinner",
      preorderInterest: true,
    }),
    {
      selectedMenuItemIds: ["item_1", "item_2"],
      groupMealNotes: "Birthday dinner",
      preorderInterest: true,
    }
  );
});

test("getMenuEmptyState explains missing menus without inventing dishes", () => {
  assert.equal(getMenuEmptyState().includes("restaurant has not published"), true);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test src/components/Marketplace/restaurantMenuState.test.js
```

Expected: FAIL because `restaurantMenuState.js` does not exist.

- [ ] **Step 3: Add API functions**

Add to `src/services/api.js` near restaurant APIs:

```js
export const fetchPublicRestaurantMenu = (restaurantId) =>
  cachedGet(`/restaurants/public/${restaurantId}/menu`);
export const fetchRestaurantMenu = (restaurantId) =>
  cachedGet(`/restaurants/${restaurantId}/menu`);
export const createRestaurantMenuSection = (restaurantId, data) =>
  API.post(`/restaurants/${restaurantId}/menu/sections`, data);
export const createRestaurantMenuItem = (restaurantId, data) =>
  API.post(`/restaurants/${restaurantId}/menu/items`, data);
export const fetchRestaurantPartnerMenu = (restaurantId) =>
  cachedGet(`/restaurant-partner-auth/restaurants/${restaurantId}/menu`, {
    headers: getRestaurantPartnerAuthHeaders(),
  });
export const createRestaurantPartnerMenuSection = (restaurantId, data) =>
  API.post(`/restaurant-partner-auth/restaurants/${restaurantId}/menu/sections`, data, {
    headers: getRestaurantPartnerAuthHeaders(),
  });
export const createRestaurantPartnerMenuItem = (restaurantId, data) =>
  API.post(`/restaurant-partner-auth/restaurants/${restaurantId}/menu/items`, data, {
    headers: getRestaurantPartnerAuthHeaders(),
  });
```

- [ ] **Step 4: Implement state helper**

Create `src/components/Marketplace/restaurantMenuState.js`:

```js
const toTrimmedString = (value) => String(value || "").trim();
const toStringArray = (value) =>
  Array.isArray(value) ? value.map((item) => toTrimmedString(item)).filter(Boolean) : [];

const normalizeItem = (item = {}, index = 0) => ({
  ...item,
  id: item.id || item._id || `restaurant-menu-item-${index}`,
  name: item.name || "Menu item",
  description: item.description || "",
  price: Number(item.price || 0),
  currency: item.currency || "USD",
  priceLabel: Number(item.price || 0) > 0 ? `${item.currency || "USD"} ${Number(item.price || 0)}` : "Price on confirmation",
  dietaryTags: toStringArray(item.dietaryTags),
  allergenTags: toStringArray(item.allergenTags),
  featured: item.featured === true,
  groupFriendly: item.groupFriendly === true,
  preorderEnabled: item.preorderEnabled === true,
});

export const normalizeRestaurantMenuPreview = (preview = {}) => {
  const items = (Array.isArray(preview.items) ? preview.items : [])
    .filter((item) => item && typeof item === "object")
    .map(normalizeItem)
    .filter((item) => item.name);

  return {
    sections: Array.isArray(preview.sections) ? preview.sections : [],
    items,
    featuredItems: items.filter((item) => item.featured).slice(0, 6),
    groupFriendlyItems: items.filter((item) => item.groupFriendly).slice(0, 6),
    preorderItems: items.filter((item) => item.preorderEnabled).slice(0, 6),
    disclaimer:
      preview.disclaimer ||
      "Menu availability and final pricing are confirmed by the restaurant/operator.",
  };
};

export const buildMenuSelectionPayload = (selection = {}) => ({
  selectedMenuItemIds: toStringArray(selection.selectedMenuItemIds),
  groupMealNotes: toTrimmedString(selection.groupMealNotes),
  preorderInterest: selection.preorderInterest === true,
});

export const getMenuEmptyState = () =>
  "This restaurant has not published a structured menu yet. The operator can still confirm dining details after inquiry.";
```

- [ ] **Step 5: Create public preview component**

Create `src/components/Marketplace/RestaurantMenuPreview.jsx`:

```jsx
import { FaLeaf, FaUtensils, FaUsers } from "react-icons/fa";
import { getMenuEmptyState, normalizeRestaurantMenuPreview } from "./restaurantMenuState";

const RestaurantMenuPreview = ({ preview }) => {
  const menu = normalizeRestaurantMenuPreview(preview || {});
  const visibleItems = menu.featuredItems.length ? menu.featuredItems : menu.items.slice(0, 6);

  if (!visibleItems.length) {
    return (
      <section className="rounded-[28px] border border-[#d8c8ae] bg-white p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">Menu preview</p>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{getMenuEmptyState()}</p>
      </section>
    );
  }

  return (
    <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_24px_80px_rgba(35,66,50,0.10)]">
      <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
        <FaUtensils /> Menu confidence
      </p>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
        Menu highlights for this dining stop
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {visibleItems.map((item) => (
          <article key={item.id} className="rounded-[26px] border border-[#eadcc5] bg-[#fffaf1] p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">{item.name}</h3>
              <span className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7451]">
                {item.priceLabel}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.description || "Details confirmed by the operator."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.groupFriendly ? <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6f0] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#234232]"><FaUsers /> Group</span> : null}
              {item.dietaryTags.slice(0, 2).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600"><FaLeaf /> {tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <p className="mt-5 text-xs font-bold leading-5 text-slate-500">{menu.disclaimer}</p>
    </section>
  );
};

export default RestaurantMenuPreview;
```

- [ ] **Step 6: Mount public preview in `RestaurantDetail.jsx`**

Import:

```jsx
import RestaurantMenuPreview from "../components/Marketplace/RestaurantMenuPreview";
import { fetchPublicRestaurantMenu, fetchPublicRestaurantBySlug, fetchRestaurantReservationOptions } from "../services/api";
```

Add state:

```jsx
const [menuPreview, setMenuPreview] = useState(null);
```

After loading restaurant and reservation options, call:

```js
const menuResponse = await fetchPublicRestaurantMenu(loadedRestaurant.id || loadedRestaurant._id)
  .catch(() => ({ data: null }));
setMenuPreview(menuResponse.data || null);
```

Mount before reservation/concierge grid:

```jsx
<div className="mt-8">
  <RestaurantMenuPreview preview={menuPreview} />
</div>
```

- [ ] **Step 7: Run frontend tests**

Run:

```bash
node --test src/components/Marketplace/restaurantMenuState.test.js
```

Expected: all tests pass.

- [ ] **Step 8: Commit public menu preview**

Run:

```bash
git add src/services/api.js src/components/Marketplace/restaurantMenuState.js src/components/Marketplace/restaurantMenuState.test.js src/components/Marketplace/RestaurantMenuPreview.jsx src/pages/RestaurantDetail.jsx
git commit -m "feat: show restaurant menu previews"
```

## Task 5: Reservation Widget Menu Interest

**Files:**
- Modify: `src/components/Marketplace/restaurantReservationState.js`
- Modify: `src/components/Marketplace/restaurantReservationState.test.js`
- Modify: `src/components/Marketplace/RestaurantReservationWidget.jsx`

- [ ] **Step 1: Add failing reservation state test**

Append to `src/components/Marketplace/restaurantReservationState.test.js`:

```js
test("buildRestaurantReservationPayload includes menu interest", () => {
  const payload = buildRestaurantReservationPayload(
    {
      travelerName: "Amina",
      travelerEmail: "AMINA@example.com",
      date: "2026-06-01",
      preferredTime: "19:00",
      guestCount: 8,
      selectedMenuItemIds: ["item_1", ""],
      groupMealNotes: "Birthday dinner",
      preorderInterest: true,
    },
    { source: "direct" }
  );

  assert.deepEqual(payload.selectedMenuItemIds, ["item_1"]);
  assert.equal(payload.groupMealNotes, "Birthday dinner");
  assert.equal(payload.preorderInterest, true);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test src/components/Marketplace/restaurantReservationState.test.js
```

Expected: FAIL because menu-interest payload fields are missing.

- [ ] **Step 3: Extend `restaurantReservationState.js` payload**

Add helper:

```js
const toStringArray = (value) =>
  Array.isArray(value) ? value.map((item) => toTrimmedString(item)).filter(Boolean) : [];
```

Add to `buildRestaurantReservationPayload`:

```js
  selectedMenuItemIds: toStringArray(form.selectedMenuItemIds),
  groupMealNotes: toTrimmedString(form.groupMealNotes),
  preorderInterest: form.preorderInterest === true,
```

- [ ] **Step 4: Extend widget form**

In `RestaurantReservationWidget.jsx`, add to `initialForm`:

```js
  selectedMenuItemIds: [],
  groupMealNotes: "",
  preorderInterest: false,
```

Add UI before the dietary notes textarea:

```jsx
<label className="flex items-start gap-3 rounded-2xl border border-[#d8c8ae] bg-white p-4 text-sm font-bold text-slate-700">
  <input
    type="checkbox"
    checked={form.preorderInterest}
    onChange={(event) => updateField("preorderInterest", event.target.checked)}
    className="mt-1"
  />
  I am interested in pre-ordering or arranging a group meal package.
</label>

<textarea
  placeholder="Group meal notes, preferred dishes, or pre-order details"
  value={form.groupMealNotes}
  onChange={(event) => updateField("groupMealNotes", event.target.value)}
  className="min-h-20 w-full rounded-2xl border border-[#d8c8ae] bg-white px-3 py-3 text-sm font-bold text-slate-800"
/>
```

- [ ] **Step 5: Run reservation widget tests**

Run:

```bash
node --test src/components/Marketplace/restaurantReservationState.test.js
```

Expected: all tests pass.

- [ ] **Step 6: Commit reservation menu interest UI**

Run:

```bash
git add src/components/Marketplace/restaurantReservationState.js src/components/Marketplace/restaurantReservationState.test.js src/components/Marketplace/RestaurantReservationWidget.jsx
git commit -m "feat: capture restaurant menu interest"
```

## Task 6: Partner Menu Workspace

**Files:**
- Modify: `src/pages/RestaurantPartnerDashboard.jsx`
- Modify: `src/components/RestaurantPartner/restaurantPartnerReservationState.js`
- Test: existing partner state tests or source route tests.

- [ ] **Step 1: Add source test for partner menu workspace**

Append to `src/pages/restaurantPartnerRoutes.test.js` or create a dashboard source test:

```js
test("RestaurantPartnerDashboard exposes menu workspace controls", async () => {
  const source = await readFile(new URL("./RestaurantPartnerDashboard.jsx", import.meta.url), "utf8");

  assert.equal(source.includes("fetchRestaurantPartnerMenu"), true);
  assert.equal(source.includes("createRestaurantPartnerMenuSection"), true);
  assert.equal(source.includes("createRestaurantPartnerMenuItem"), true);
  assert.equal(source.includes("Menu workspace"), true);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test src/pages/restaurantPartnerRoutes.test.js
```

Expected: FAIL because partner dashboard does not expose menu workspace yet.

- [ ] **Step 3: Add partner dashboard imports**

Add to `src/pages/RestaurantPartnerDashboard.jsx` service imports:

```js
  fetchRestaurantPartnerMenu,
  createRestaurantPartnerMenuSection,
  createRestaurantPartnerMenuItem,
```

- [ ] **Step 4: Add compact menu workspace state**

Inside `RestaurantPartnerDashboard`, add state:

```js
const [menu, setMenu] = useState({ sections: [], items: [] });
const [menuSectionDraft, setMenuSectionDraft] = useState({ title: "", description: "" });
const [menuItemDraft, setMenuItemDraft] = useState({
  name: "",
  description: "",
  price: "",
  currency: "USD",
  groupFriendly: false,
  preorderEnabled: false,
});
```

When selected restaurant changes, fetch menu:

```js
if (selectedRestaurant?._id || selectedRestaurant?.id) {
  const restaurantId = selectedRestaurant._id || selectedRestaurant.id;
  fetchRestaurantPartnerMenu(restaurantId)
    .then((response) => setMenu(response.data || { sections: [], items: [] }))
    .catch(() => setMenu({ sections: [], items: [] }));
}
```

- [ ] **Step 5: Add menu workspace UI**

Add a compact card near reservation operations:

```jsx
<section className="rounded-[28px] border border-[#d8c8ae] bg-white p-5 shadow-sm">
  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">Menu workspace</p>
  <h3 className="mt-2 text-xl font-black text-slate-950">Group dining menu</h3>
  <p className="mt-2 text-sm font-medium text-slate-600">
    Add menu sections and pre-order friendly items for traveler confidence and group dining deposits.
  </p>
  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <input
      placeholder="Section title"
      value={menuSectionDraft.title}
      onChange={(event) => setMenuSectionDraft((current) => ({ ...current, title: event.target.value }))}
      className="rounded-2xl border border-[#d8c8ae] px-3 py-3 text-sm font-bold"
    />
    <button
      type="button"
      onClick={async () => {
        const restaurantId = selectedRestaurant._id || selectedRestaurant.id;
        await createRestaurantPartnerMenuSection(restaurantId, menuSectionDraft);
        const response = await fetchRestaurantPartnerMenu(restaurantId);
        setMenu(response.data || { sections: [], items: [] });
        setMenuSectionDraft({ title: "", description: "" });
      }}
      className="rounded-2xl bg-[#234232] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
    >
      Add section
    </button>
  </div>
  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <input
      placeholder="Menu item name"
      value={menuItemDraft.name}
      onChange={(event) => setMenuItemDraft((current) => ({ ...current, name: event.target.value }))}
      className="rounded-2xl border border-[#d8c8ae] px-3 py-3 text-sm font-bold"
    />
    <input
      placeholder="Price"
      value={menuItemDraft.price}
      onChange={(event) => setMenuItemDraft((current) => ({ ...current, price: event.target.value }))}
      className="rounded-2xl border border-[#d8c8ae] px-3 py-3 text-sm font-bold"
    />
  </div>
  <button
    type="button"
    onClick={async () => {
      const restaurantId = selectedRestaurant._id || selectedRestaurant.id;
      await createRestaurantPartnerMenuItem(restaurantId, menuItemDraft);
      const response = await fetchRestaurantPartnerMenu(restaurantId);
      setMenu(response.data || { sections: [], items: [] });
      setMenuItemDraft({ name: "", description: "", price: "", currency: "USD", groupFriendly: false, preorderEnabled: false });
    }}
    className="mt-3 rounded-2xl border border-[#234232] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#234232]"
  >
    Add menu item
  </button>
  <p className="mt-4 text-sm font-bold text-slate-600">
    {menu.items.length} menu items stored for this restaurant.
  </p>
</section>
```

- [ ] **Step 6: Run partner dashboard test**

Run:

```bash
node --test src/pages/restaurantPartnerRoutes.test.js
```

Expected: all tests pass.

- [ ] **Step 7: Commit partner workspace**

Run:

```bash
git add src/pages/RestaurantPartnerDashboard.jsx src/pages/restaurantPartnerRoutes.test.js
git commit -m "feat: add restaurant partner menu workspace"
```

## Task 7: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run focused backend tests**

Run:

```bash
node --test backend/tests/restaurantMenu.test.js backend/tests/restaurantReservations.test.js backend/tests/restaurantRoutes.test.js backend/tests/restaurantPartnerRoutes.test.js
```

Expected: all tests pass.

- [ ] **Step 2: Run focused frontend tests**

Run:

```bash
node --test src/components/Marketplace/restaurantMenuState.test.js src/components/Marketplace/restaurantReservationState.test.js src/pages/restaurantPartnerRoutes.test.js
```

Expected: all tests pass.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: Vite client build, SSR build, and prerender complete. Existing chunk-size warnings are acceptable.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected: only unrelated local image/JPEG changes remain unstaged if they existed before; all feature files are committed.
