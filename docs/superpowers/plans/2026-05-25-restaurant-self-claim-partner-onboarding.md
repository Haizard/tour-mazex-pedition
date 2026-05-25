# Restaurant Self-Claim And Partner Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first restaurant continuation phase so restaurant staff can claim existing listings, request new fallback listings, and receive approved restaurant-partner access through a moderated review flow.

**Architecture:** Reuse the hotel-claim pattern, but keep restaurant ownership isolated around the canonical `Restaurant` entity. Introduce a dedicated `RestaurantClaimRequest` review model, public search-and-claim endpoints, an admin moderation queue, and approved restaurant-partner access creation that attaches only to canonical restaurants.

**Tech Stack:** Node.js, Express, Mongoose, React, Vite, existing partner auth flows, Node test runner

---

## File Structure

### New backend files
- `backend/models/RestaurantClaimRequest.js`
  - pending claim and fallback new-listing review record
- `backend/utils/restaurantClaimFlow.js`
  - claim normalization, review shaping, approval and rejection helpers
- `backend/tests/restaurantClaimFlow.test.js`
  - unit coverage for claim flow normalization and approval logic

### Modified backend files
- `backend/routes/restaurantRoutes.js`
  - public search/claim intake and tenant-admin moderation endpoints
- `backend/server.js`
  - ensure restaurant routes are already mounted correctly if needed, no new mount path unless missing
- `backend/models/RestaurantPartnerAdmin.js`
  - only if restaurant-specific fields or indexes are missing
- `backend/utils/restaurantPartnerAccess.js`
  - only if current partner access creation is too hotel-specific
- `backend/tests/restaurantRoutes.test.js`
  - route-shape and request-flow coverage

### New frontend files
- `src/pages/RestaurantClaimPage.jsx`
  - public restaurant claim and fallback new-listing request page
- `src/pages/restaurantClaimPageState.js`
  - draft, payload, and result shaping helpers for the claim page
- `src/pages/restaurantClaimPageState.test.js`
  - tests for claim-page state helpers
- `src/components/Admin/RestaurantClaimManager.jsx`
  - admin moderation queue for restaurant claims
- `src/components/Admin/restaurantClaimManagerState.js`
  - filtering and action-summary helpers for moderation UI
- `src/components/Admin/restaurantClaimManagerState.test.js`
  - tests for moderation helper behavior

### Modified frontend files
- `src/services/api.js`
  - public and admin restaurant claim APIs
- `src/AppRoutes.jsx`
  - route registration for the public restaurant claim page
- `src/components/Admin/RestaurantManager.jsx`
  - link or embed the claim queue in the restaurant admin workspace
- `src/pages/RestaurantPartnerLogin.jsx`
  - only if onboarding copy needs restaurant-claim messaging

---

### Task 1: Add Restaurant Claim Domain Model And Helpers

**Files:**
- Create: `backend/models/RestaurantClaimRequest.js`
- Create: `backend/utils/restaurantClaimFlow.js`
- Test: `backend/tests/restaurantClaimFlow.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestaurantClaimPayload,
  shapeRestaurantClaimForAdmin,
  approveRestaurantClaimDraft,
} from "../utils/restaurantClaimFlow.js";

test("buildRestaurantClaimPayload normalizes existing-listing requests", () => {
  const payload = buildRestaurantClaimPayload({
    tenantId: "tenant-1",
    restaurantId: "restaurant-1",
    restaurantNameSnapshot: "Savanna Table",
    destinationSnapshot: "Arusha",
    regionSnapshot: "Northern Circuit",
    claimantName: "Amina",
    claimantEmail: "owner@savannatable.com",
    claimantPhone: "+255700000001",
    claimantRole: "Owner",
    proofNote: "I manage this property directly.",
    proofLinks: ["https://savannatable.com"],
    claimType: "existing-listing",
  });

  assert.equal(payload.restaurantId, "restaurant-1");
  assert.equal(payload.claimType, "existing-listing");
  assert.deepEqual(payload.proofLinks, ["https://savannatable.com"]);
  assert.equal(payload.status, "pending");
});

test("shapeRestaurantClaimForAdmin adds safe review defaults", () => {
  const row = shapeRestaurantClaimForAdmin({
    _id: "claim-1",
    status: "pending",
    restaurantNameSnapshot: "Savanna Table",
  });

  assert.equal(row.statusLabel, "Pending review");
  assert.equal(row.claimTypeLabel, "Existing listing");
  assert.equal(row.requiresReview, true);
});

test("approveRestaurantClaimDraft returns approval metadata", () => {
  const result = approveRestaurantClaimDraft({
    claim: { _id: "claim-1", restaurantId: "restaurant-1" },
    reviewerId: "admin-1",
  });

  assert.equal(result.status, "approved");
  assert.equal(result.reviewedBy, "admin-1");
  assert.equal(result.restaurantId, "restaurant-1");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/restaurantClaimFlow.test.js`  
Expected: FAIL because `restaurantClaimFlow.js` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
// backend/utils/restaurantClaimFlow.js
const CLAIM_TYPE_LABELS = {
  "existing-listing": "Existing listing",
  "new-listing-request": "New listing request",
};

const STATUS_LABELS = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  "needs-more-proof": "Needs more proof",
};

const normalizeProofLinks = (proofLinks = []) =>
  (Array.isArray(proofLinks) ? proofLinks : [proofLinks])
    .map((value) => String(value || "").trim())
    .filter(Boolean);

export const buildRestaurantClaimPayload = (draft = {}) => ({
  tenantId: draft.tenantId ? String(draft.tenantId) : "",
  restaurantId: draft.restaurantId ? String(draft.restaurantId) : "",
  restaurantNameSnapshot: String(draft.restaurantNameSnapshot || "").trim(),
  destinationSnapshot: String(draft.destinationSnapshot || "").trim(),
  regionSnapshot: String(draft.regionSnapshot || "").trim(),
  claimantName: String(draft.claimantName || "").trim(),
  claimantEmail: String(draft.claimantEmail || "").trim().toLowerCase(),
  claimantPhone: String(draft.claimantPhone || "").trim(),
  claimantRole: String(draft.claimantRole || "").trim(),
  proofNote: String(draft.proofNote || "").trim(),
  proofLinks: normalizeProofLinks(draft.proofLinks),
  claimType: draft.claimType === "new-listing-request" ? "new-listing-request" : "existing-listing",
  status: "pending",
  proposedRestaurant: draft.proposedRestaurant || null,
});

export const shapeRestaurantClaimForAdmin = (claim = {}) => ({
  ...claim,
  claimTypeLabel: CLAIM_TYPE_LABELS[claim.claimType] || CLAIM_TYPE_LABELS["existing-listing"],
  statusLabel: STATUS_LABELS[claim.status] || STATUS_LABELS.pending,
  requiresReview: claim.status !== "approved" && claim.status !== "rejected",
});

export const approveRestaurantClaimDraft = ({ claim, reviewerId }) => ({
  ...claim,
  status: "approved",
  reviewedAt: new Date().toISOString(),
  reviewedBy: reviewerId,
});
```

```js
// backend/models/RestaurantClaimRequest.js
import mongoose from "mongoose";

const restaurantClaimRequestSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: "" },
    restaurantId: { type: String, default: "" },
    restaurantNameSnapshot: { type: String, required: true, trim: true },
    destinationSnapshot: { type: String, default: "", trim: true },
    regionSnapshot: { type: String, default: "", trim: true },
    claimantName: { type: String, required: true, trim: true },
    claimantEmail: { type: String, required: true, trim: true, lowercase: true },
    claimantPhone: { type: String, default: "", trim: true },
    claimantRole: { type: String, default: "", trim: true },
    proofNote: { type: String, default: "", trim: true },
    proofLinks: { type: [String], default: [] },
    claimType: {
      type: String,
      enum: ["existing-listing", "new-listing-request"],
      default: "existing-listing",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "needs-more-proof"],
      default: "pending",
    },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: "" },
    reviewNote: { type: String, default: "", trim: true },
    linkedPartnerAdminId: { type: String, default: "" },
    proposedRestaurant: { type: Object, default: null },
  },
  { timestamps: true }
);

restaurantClaimRequestSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
restaurantClaimRequestSchema.index({ restaurantId: 1, status: 1 });

const RestaurantClaimRequest =
  mongoose.models.RestaurantClaimRequest ||
  mongoose.model("RestaurantClaimRequest", restaurantClaimRequestSchema);

export default RestaurantClaimRequest;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/restaurantClaimFlow.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/models/RestaurantClaimRequest.js backend/utils/restaurantClaimFlow.js backend/tests/restaurantClaimFlow.test.js
git commit -m "feat: add restaurant claim request foundation"
```

---

### Task 2: Add Public Restaurant Search And Claim Intake Endpoints

**Files:**
- Modify: `backend/routes/restaurantRoutes.js`
- Modify: `backend/tests/restaurantRoutes.test.js`
- Modify: `src/services/api.js`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("restaurant routes expose public claim endpoints", async () => {
  const source = await fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8");

  assert.match(source, /router\.get\("\/public\/claim-search"/);
  assert.match(source, /router\.post\("\/public\/claims"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/restaurantRoutes.test.js`  
Expected: FAIL because claim-search and claims routes are missing.

- [ ] **Step 3: Write minimal implementation**

```js
// backend/routes/restaurantRoutes.js
router.get("/public/claim-search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (!query) return res.status(200).json({ restaurants: [] });

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const restaurants = await Restaurant.find({
    marketplaceVisible: true,
    $or: [{ name: regex }, { destination: regex }, { region: regex }],
  })
    .sort({ sponsoredPlacement: -1, averageRating: -1, name: 1 })
    .limit(12)
    .lean();

  res.status(200).json({
    restaurants: restaurants.map((restaurant) => ({
      _id: String(restaurant._id),
      name: restaurant.name || "",
      slug: restaurant.slug || "",
      destination: restaurant.destination || "",
      region: restaurant.region || "",
      cuisineTypes: Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes : [],
      published: restaurant.published === true,
      marketplaceVisible: restaurant.marketplaceVisible === true,
    })),
  });
});

router.post("/public/claims", async (req, res) => {
  const payload = buildRestaurantClaimPayload(req.body || {});
  if (!payload.restaurantNameSnapshot || !payload.claimantName || !payload.claimantEmail) {
    return res.status(400).json({ message: "Restaurant, claimant name, and claimant email are required." });
  }

  const claim = await RestaurantClaimRequest.create(payload);
  res.status(201).json({
    message: "Restaurant claim request submitted.",
    claim: shapeRestaurantClaimForAdmin(claim.toObject()),
  });
});
```

```js
// src/services/api.js
export const searchRestaurantClaimListings = (query) =>
  API.get("/restaurants/public/claim-search", { params: { q: query } });

export const submitRestaurantClaimRequest = (payload) =>
  API.post("/restaurants/public/claims", payload);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test backend/tests/restaurantRoutes.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/routes/restaurantRoutes.js backend/tests/restaurantRoutes.test.js src/services/api.js
git commit -m "feat: add public restaurant claim intake routes"
```

---

### Task 3: Add Admin Moderation Endpoints For Restaurant Claims

**Files:**
- Modify: `backend/routes/restaurantRoutes.js`
- Modify: `backend/utils/restaurantClaimFlow.js`
- Modify: `backend/tests/restaurantRoutes.test.js`
- Modify: `backend/utils/restaurantPartnerAccess.js`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("restaurant routes expose claim moderation endpoints", async () => {
  const source = await fs.readFile(new URL("../routes/restaurantRoutes.js", import.meta.url), "utf8");

  assert.match(source, /router\.get\("\/claims"/);
  assert.match(source, /router\.post\("\/claims\/:claimId\/approve"/);
  assert.match(source, /router\.post\("\/claims\/:claimId\/reject"/);
  assert.match(source, /router\.post\("\/claims\/:claimId\/needs-more-proof"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/restaurantRoutes.test.js`  
Expected: FAIL because moderation endpoints do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
// backend/utils/restaurantClaimFlow.js
export const rejectRestaurantClaimDraft = ({ claim, reviewerId, reviewNote = "" }) => ({
  ...claim,
  status: "rejected",
  reviewedAt: new Date().toISOString(),
  reviewedBy: reviewerId,
  reviewNote: String(reviewNote || "").trim(),
});

export const needsMoreProofRestaurantClaimDraft = ({ claim, reviewerId, reviewNote = "" }) => ({
  ...claim,
  status: "needs-more-proof",
  reviewedAt: new Date().toISOString(),
  reviewedBy: reviewerId,
  reviewNote: String(reviewNote || "").trim(),
});
```

```js
// backend/routes/restaurantRoutes.js
router.get("/claims", authenticateToken, async (req, res) => {
  const claims = await RestaurantClaimRequest.find({ tenantId: req.user.tenantId || "" })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(claims.map(shapeRestaurantClaimForAdmin));
});

router.post("/claims/:claimId/approve", authenticateToken, async (req, res) => {
  const claim = await RestaurantClaimRequest.findById(req.params.claimId);
  if (!claim) return res.status(404).json({ message: "Restaurant claim not found." });

  const restaurant = claim.restaurantId ? await Restaurant.findById(claim.restaurantId) : null;
  if (!restaurant && claim.claimType === "existing-listing") {
    return res.status(400).json({ message: "Claimed restaurant no longer exists." });
  }

  const partnerAdmin = await createRestaurantPartnerAdminFromClaim({
    claim,
    reviewer: req.user,
    restaurant,
  });

  Object.assign(
    claim,
    approveRestaurantClaimDraft({
      claim: claim.toObject(),
      reviewerId: String(req.user.id || req.user._id || ""),
    }),
    { linkedPartnerAdminId: String(partnerAdmin._id || "") }
  );
  await claim.save();

  res.status(200).json({
    message: "Restaurant claim approved.",
    claim: shapeRestaurantClaimForAdmin(claim.toObject()),
  });
});

router.post("/claims/:claimId/reject", authenticateToken, async (req, res) => {
  const claim = await RestaurantClaimRequest.findById(req.params.claimId);
  if (!claim) return res.status(404).json({ message: "Restaurant claim not found." });

  Object.assign(
    claim,
    rejectRestaurantClaimDraft({
      claim: claim.toObject(),
      reviewerId: String(req.user.id || req.user._id || ""),
      reviewNote: req.body?.reviewNote,
    })
  );
  await claim.save();

  res.status(200).json({ message: "Restaurant claim rejected.", claim: shapeRestaurantClaimForAdmin(claim.toObject()) });
});

router.post("/claims/:claimId/needs-more-proof", authenticateToken, async (req, res) => {
  const claim = await RestaurantClaimRequest.findById(req.params.claimId);
  if (!claim) return res.status(404).json({ message: "Restaurant claim not found." });

  Object.assign(
    claim,
    needsMoreProofRestaurantClaimDraft({
      claim: claim.toObject(),
      reviewerId: String(req.user.id || req.user._id || ""),
      reviewNote: req.body?.reviewNote,
    })
  );
  await claim.save();

  res.status(200).json({
    message: "Restaurant claim marked as needing more proof.",
    claim: shapeRestaurantClaimForAdmin(claim.toObject()),
  });
});
```

```js
// backend/utils/restaurantPartnerAccess.js
import bcrypt from "bcryptjs";
import RestaurantPartnerAdmin from "../models/RestaurantPartnerAdmin.js";

export const createRestaurantPartnerAdminFromClaim = async ({ claim, reviewer, restaurant }) => {
  const temporaryPassword = `restaurant-${Math.random().toString(36).slice(2, 10)}`;
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  return RestaurantPartnerAdmin.create({
    tenantId: claim.tenantId || reviewer?.tenantId || "",
    restaurantId: restaurant ? String(restaurant._id) : claim.restaurantId || "",
    name: claim.claimantName,
    email: claim.claimantEmail,
    phone: claim.claimantPhone,
    role: claim.claimantRole || "manager",
    passwordHash,
    onboardingState: "claimed",
    createdByClaimRequestId: String(claim._id || ""),
  });
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test backend/tests/restaurantRoutes.test.js backend/tests/restaurantClaimFlow.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/routes/restaurantRoutes.js backend/utils/restaurantClaimFlow.js backend/utils/restaurantPartnerAccess.js backend/tests/restaurantRoutes.test.js
git commit -m "feat: add restaurant claim moderation flow"
```

---

### Task 4: Add Public Restaurant Claim Page

**Files:**
- Create: `src/pages/RestaurantClaimPage.jsx`
- Create: `src/pages/restaurantClaimPageState.js`
- Create: `src/pages/restaurantClaimPageState.test.js`
- Modify: `src/AppRoutes.jsx`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmptyRestaurantClaimDraft,
  buildRestaurantClaimRequestPayload,
} from "./restaurantClaimPageState.js";

test("createEmptyRestaurantClaimDraft defaults to existing-listing flow", () => {
  const draft = createEmptyRestaurantClaimDraft();
  assert.equal(draft.claimType, "existing-listing");
  assert.equal(draft.claimantEmail, "");
});

test("buildRestaurantClaimRequestPayload keeps fallback new-listing structure", () => {
  const payload = buildRestaurantClaimRequestPayload({
    claimType: "new-listing-request",
    restaurantNameSnapshot: "New Flame",
    claimantName: "Noor",
    claimantEmail: "owner@example.com",
    proposedRestaurant: { destination: "Zanzibar" },
  });

  assert.equal(payload.claimType, "new-listing-request");
  assert.equal(payload.proposedRestaurant.destination, "Zanzibar");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/pages/restaurantClaimPageState.test.js`  
Expected: FAIL because claim page state helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
// src/pages/restaurantClaimPageState.js
export const createEmptyRestaurantClaimDraft = () => ({
  claimType: "existing-listing",
  restaurantId: "",
  restaurantNameSnapshot: "",
  destinationSnapshot: "",
  regionSnapshot: "",
  claimantName: "",
  claimantEmail: "",
  claimantPhone: "",
  claimantRole: "",
  proofNote: "",
  proofLinksText: "",
  proposedRestaurant: null,
});

export const buildRestaurantClaimRequestPayload = (draft = {}) => ({
  claimType: draft.claimType === "new-listing-request" ? "new-listing-request" : "existing-listing",
  restaurantId: draft.restaurantId || "",
  restaurantNameSnapshot: String(draft.restaurantNameSnapshot || "").trim(),
  destinationSnapshot: String(draft.destinationSnapshot || "").trim(),
  regionSnapshot: String(draft.regionSnapshot || "").trim(),
  claimantName: String(draft.claimantName || "").trim(),
  claimantEmail: String(draft.claimantEmail || "").trim(),
  claimantPhone: String(draft.claimantPhone || "").trim(),
  claimantRole: String(draft.claimantRole || "").trim(),
  proofNote: String(draft.proofNote || "").trim(),
  proofLinks: String(draft.proofLinksText || "")
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean),
  proposedRestaurant: draft.claimType === "new-listing-request" ? draft.proposedRestaurant || null : null,
});
```

```jsx
// src/pages/RestaurantClaimPage.jsx
import { useMemo, useState } from "react";
import { FaSearch, FaStore, FaClipboardCheck } from "react-icons/fa";

import { searchRestaurantClaimListings, submitRestaurantClaimRequest } from "../services/api";
import {
  buildRestaurantClaimRequestPayload,
  createEmptyRestaurantClaimDraft,
} from "./restaurantClaimPageState";

const RestaurantClaimPage = () => {
  const [draft, setDraft] = useState(createEmptyRestaurantClaimDraft);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedRestaurant = useMemo(
    () => results.find((item) => item._id === draft.restaurantId) || null,
    [results, draft.restaurantId]
  );

  const runSearch = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await searchRestaurantClaimListings(query);
      setResults(Array.isArray(response.data?.restaurants) ? response.data.restaurants : []);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to search restaurants.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const payload = buildRestaurantClaimRequestPayload(draft);
      await submitRestaurantClaimRequest(payload);
      setMessage("Restaurant claim request submitted.");
      setDraft(createEmptyRestaurantClaimDraft());
      setResults([]);
      setQuery("");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to submit claim request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-700">Restaurant Claim</p>
        <h1 className="mt-3 text-3xl font-black text-zinc-950">Claim your restaurant listing</h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-600">
          Search for your restaurant first. If it already exists, claim the existing listing. Only use the new-listing
          fallback if your restaurant is not yet in the marketplace.
        </p>
      </div>

      <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by restaurant name, destination, or region"
            className="flex-1 rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
          />
          <button type="button" onClick={runSearch} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white">
            <FaSearch className="inline-block" /> Search
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? <p className="text-sm text-zinc-500">Searching restaurants...</p> : null}
          {!loading &&
            results.map((restaurant) => (
              <button
                key={restaurant._id}
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    claimType: "existing-listing",
                    restaurantId: restaurant._id,
                    restaurantNameSnapshot: restaurant.name || "",
                    destinationSnapshot: restaurant.destination || "",
                    regionSnapshot: restaurant.region || "",
                  }))
                }
                className="block w-full rounded-2xl border border-zinc-200 p-4 text-left hover:border-emerald-400"
              >
                <p className="text-sm font-black text-zinc-950">{restaurant.name}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {restaurant.destination || "Destination pending"}
                  {restaurant.region ? ` · ${restaurant.region}` : ""}
                </p>
              </button>
            ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              claimType: "new-listing-request",
              restaurantId: "",
            }))
          }
          className="mt-4 text-sm font-bold text-emerald-700"
        >
          My restaurant is not listed
        </button>
      </div>

      {(selectedRestaurant || draft.claimType === "new-listing-request") && (
        <form onSubmit={submit} className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-900">
            {draft.claimType === "existing-listing" ? <FaClipboardCheck /> : <FaStore />}
            <p className="text-lg font-black">
              {draft.claimType === "existing-listing" ? "Claim existing listing" : "Request a new restaurant listing"}
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              ["claimantName", "Your name"],
              ["claimantEmail", "Work email"],
              ["claimantPhone", "Phone / WhatsApp"],
              ["claimantRole", "Role"],
            ].map(([key, label]) => (
              <label key={key} className="text-sm font-semibold text-zinc-700">
                {label}
                <input
                  value={draft[key]}
                  onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-normal"
                />
              </label>
            ))}
          </div>

          <label className="mt-4 block text-sm font-semibold text-zinc-700">
            Proof note
            <textarea
              value={draft.proofNote}
              onChange={(event) => setDraft((current) => ({ ...current, proofNote: event.target.value }))}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-normal"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-zinc-700">
            Proof links
            <textarea
              value={draft.proofLinksText}
              onChange={(event) => setDraft((current) => ({ ...current, proofLinksText: event.target.value }))}
              rows={3}
              placeholder="Website, Instagram, Google Business, etc."
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-normal"
            />
          </label>

          {message ? <p className="mt-4 text-sm text-zinc-600">{message}</p> : null}

          <button type="submit" disabled={submitting} className="mt-6 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white">
            {submitting ? "Submitting..." : "Submit request"}
          </button>
        </form>
      )}
    </div>
  );
};

export default RestaurantClaimPage;
```

```jsx
// src/AppRoutes.jsx
<Route path="/discover/restaurants/claim" element={<RestaurantClaimPage />} />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/pages/restaurantClaimPageState.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/RestaurantClaimPage.jsx src/pages/restaurantClaimPageState.js src/pages/restaurantClaimPageState.test.js src/AppRoutes.jsx
git commit -m "feat: add public restaurant claim page"
```

---

### Task 5: Add Restaurant Claim Moderation UI In Admin Workspace

**Files:**
- Create: `src/components/Admin/RestaurantClaimManager.jsx`
- Create: `src/components/Admin/restaurantClaimManagerState.js`
- Create: `src/components/Admin/restaurantClaimManagerState.test.js`
- Modify: `src/components/Admin/RestaurantManager.jsx`
- Modify: `src/services/api.js`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { filterRestaurantClaimRows } from "./restaurantClaimManagerState.js";

test("filterRestaurantClaimRows filters by status and search", () => {
  const rows = filterRestaurantClaimRows(
    [
      { restaurantNameSnapshot: "Savanna Table", status: "pending", claimantName: "Amina" },
      { restaurantNameSnapshot: "Coast Flame", status: "approved", claimantName: "Noor" },
    ],
    { status: "pending", search: "savanna" }
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].restaurantNameSnapshot, "Savanna Table");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/components/Admin/restaurantClaimManagerState.test.js`  
Expected: FAIL because moderation state helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
// src/components/Admin/restaurantClaimManagerState.js
export const filterRestaurantClaimRows = (claims = [], filters = {}) => {
  const status = String(filters.status || "all").toLowerCase();
  const search = String(filters.search || "").trim().toLowerCase();

  return claims.filter((claim) => {
    if (status !== "all" && String(claim.status || "").toLowerCase() !== status) return false;
    if (!search) return true;

    const haystack = [
      claim.restaurantNameSnapshot,
      claim.destinationSnapshot,
      claim.regionSnapshot,
      claim.claimantName,
      claim.claimantEmail,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
};
```

```jsx
// src/components/Admin/RestaurantClaimManager.jsx
import { useEffect, useMemo, useState } from "react";

import {
  approveRestaurantClaim,
  fetchRestaurantClaims,
  markRestaurantClaimNeedsMoreProof,
  rejectRestaurantClaim,
} from "../../services/api";
import { filterRestaurantClaimRows } from "./restaurantClaimManagerState";

const RestaurantClaimManager = () => {
  const [claims, setClaims] = useState([]);
  const [filters, setFilters] = useState({ status: "pending", search: "" });
  const [message, setMessage] = useState("");

  const visibleClaims = useMemo(() => filterRestaurantClaimRows(claims, filters), [claims, filters]);

  const loadClaims = async () => {
    const response = await fetchRestaurantClaims();
    setClaims(Array.isArray(response.data) ? response.data : []);
  };

  useEffect(() => {
    loadClaims().catch(() => setMessage("Unable to load restaurant claims."));
  }, []);

  const runAction = async (claimId, action) => {
    const actions = {
      approve: approveRestaurantClaim,
      reject: rejectRestaurantClaim,
      proof: markRestaurantClaimNeedsMoreProof,
    };
    await actions[action](claimId);
    await loadClaims();
    setMessage("Claim updated.");
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-700">Restaurant Claims</p>
          <h2 className="mt-2 text-2xl font-black text-zinc-950">Claim moderation queue</h2>
        </div>
        <input
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search claims"
          className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
        />
      </div>

      {message ? <p className="mt-4 text-sm text-zinc-600">{message}</p> : null}

      <div className="mt-4 space-y-3">
        {visibleClaims.map((claim) => (
          <div key={claim._id} className="rounded-2xl border border-zinc-200 p-4">
            <p className="text-sm font-black text-zinc-950">{claim.restaurantNameSnapshot}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {claim.claimantName} · {claim.claimantEmail} · {claim.statusLabel || claim.status}
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => runAction(claim._id, "approve")} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white">
                Approve
              </button>
              <button type="button" onClick={() => runAction(claim._id, "proof")} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white">
                Needs proof
              </button>
              <button type="button" onClick={() => runAction(claim._id, "reject")} className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RestaurantClaimManager;
```

```js
// src/services/api.js
export const fetchRestaurantClaims = () => API.get("/restaurants/claims");
export const approveRestaurantClaim = (claimId, payload = {}) =>
  API.post(`/restaurants/claims/${encodeURIComponent(claimId)}/approve`, payload);
export const rejectRestaurantClaim = (claimId, payload = {}) =>
  API.post(`/restaurants/claims/${encodeURIComponent(claimId)}/reject`, payload);
export const markRestaurantClaimNeedsMoreProof = (claimId, payload = {}) =>
  API.post(`/restaurants/claims/${encodeURIComponent(claimId)}/needs-more-proof`, payload);
```

```jsx
// src/components/Admin/RestaurantManager.jsx
<RestaurantClaimManager />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/components/Admin/restaurantClaimManagerState.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/RestaurantClaimManager.jsx src/components/Admin/restaurantClaimManagerState.js src/components/Admin/restaurantClaimManagerState.test.js src/components/Admin/RestaurantManager.jsx src/services/api.js
git commit -m "feat: add restaurant claim moderation ui"
```

---

### Task 6: Verify End-To-End Claim Integration

**Files:**
- Test: `backend/tests/restaurantClaimFlow.test.js`
- Test: `backend/tests/restaurantRoutes.test.js`
- Test: `src/pages/restaurantClaimPageState.test.js`
- Test: `src/components/Admin/restaurantClaimManagerState.test.js`
- Test: `src/components/Admin/restaurantManagerState.test.js`

- [ ] **Step 1: Run the focused test suite**

Run:

```bash
node --test backend/tests/restaurantClaimFlow.test.js backend/tests/restaurantRoutes.test.js src/pages/restaurantClaimPageState.test.js src/components/Admin/restaurantClaimManagerState.test.js src/components/Admin/restaurantManagerState.test.js
```

Expected: PASS

- [ ] **Step 2: Run build verification**

Run:

```bash
npm run build
```

Expected: PASS with Vite client build, SSR build, and prerender completion.

- [ ] **Step 3: Commit the verification checkpoint**

```bash
git add backend/tests/restaurantClaimFlow.test.js backend/tests/restaurantRoutes.test.js src/pages/restaurantClaimPageState.test.js src/components/Admin/restaurantClaimManagerState.test.js
git commit -m "test: verify restaurant claim onboarding flow"
```

---

## Self-Review

### Spec coverage
- `Restaurant self-claim + partner onboarding`: covered by Tasks 1-6
- `claim existing listing first, fallback new listing second`: covered in public claim page and intake payload tasks
- `admin moderation outcomes`: covered in Task 3 and Task 5
- `approved restaurant-partner access`: covered in Task 3

### Scope check
- Reservations and table availability are intentionally excluded from this plan
- Payments and event dining checkout are intentionally excluded from this plan
- Those should each receive their own follow-up plans after Phase 1 ships

### Placeholder scan
- No TODO/TBD placeholders remain
- Each step includes exact files, code, commands, and expected outcomes

### Type consistency
- `RestaurantClaimRequest`, `RestaurantPartnerAdmin`, `claimType`, `needs-more-proof`, and moderation helpers use one naming scheme throughout

