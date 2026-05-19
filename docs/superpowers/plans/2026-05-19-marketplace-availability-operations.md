# Marketplace Availability Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated tenant-admin `Marketplace Availability` workspace for cross-tour departure operations, hybrid guaranteed/request-only availability management, and bulk marketplace updates.

**Architecture:** Extend the existing embedded `marketplaceAvailability` model instead of creating a new collection. Add a backend operations layer that flattens tour availability into admin-ready rows, exposes CRUD and bulk-update endpoints through the existing marketplace routes, and powers a new React operations workspace with table, filters, schedule drawer, and health warnings.

**Tech Stack:** React + Vite, Express, Mongoose, `node:test`, existing admin dashboard and marketplace route infrastructure

---

## File Structure

### Backend files

- Modify: `backend/models/TourPackage.js`
  - add a low-risk `published` flag to marketplace availability entries so the operations workspace can support publish/unpublish without a separate availability collection
- Modify: `backend/utils/marketplaceAvailability.js`
  - teach the summary layer to ignore unpublished entries while preserving backward compatibility for old data
- Create: `backend/utils/marketplaceAvailabilityOperations.js`
  - flatten tour availability into operations rows
  - normalize date keys
  - compute row metadata such as package title, source, instant-ready, request-only, and remaining spots
- Create: `backend/utils/marketplaceAvailabilityHealth.js`
  - compute availability warnings for missing dates, stale dates, instant-booking blockers, and malformed limited/request-only states
- Modify: `backend/routes/marketplaceEngagementRoutes.js`
  - add tenant-admin marketplace availability routes using the existing marketplace router
- Create: `backend/tests/marketplaceAvailabilityOperations.test.js`
  - cover row building, unpublished filtering, and health warnings
- Create: `backend/tests/marketplaceAvailabilityRoutes.test.js`
  - cover single-entry update, add/delete entry, and bulk updates through route-level helper functions

### Frontend files

- Modify: `src/services/api.js`
  - add marketplace availability operations API helpers
- Create: `src/components/Admin/MarketplaceAvailability/availabilityManagerState.js`
  - pure state helpers for filtering rows, selection, bulk payloads, and drawer updates
- Create: `src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js`
  - frontend TDD coverage without needing a DOM harness
- Create: `src/components/Admin/MarketplaceAvailability/MarketplaceAvailabilityManager.jsx`
  - top-level admin workspace
- Create: `src/components/Admin/MarketplaceAvailability/AvailabilityFiltersBar.jsx`
  - package/month/status/search filters
- Create: `src/components/Admin/MarketplaceAvailability/AvailabilityOperationsTable.jsx`
  - row list with inline edits and selection
- Create: `src/components/Admin/MarketplaceAvailability/AvailabilityBulkActionsBar.jsx`
  - bulk status/note/seat actions
- Create: `src/components/Admin/MarketplaceAvailability/TourScheduleDrawer.jsx`
  - focused per-tour schedule editing
- Create: `src/components/Admin/MarketplaceAvailability/AvailabilityHealthPanel.jsx`
  - warning list and quick navigation targets
- Modify: `src/components/Admin/AdminSidebar.jsx`
  - add the new tab in the right group
- Modify: `src/pages/AdminDashboard.jsx`
  - mount the availability manager and feed it tenant marketplace context
- Modify: `README.md`
  - move `Marketplace Availability` from next-up concept into implemented tracking once the work lands

### Existing files to reference while implementing

- `src/components/Admin/MarketplaceOperationsOverview.jsx`
- `src/pages/GlobalDiscovery.jsx`
- `src/pages/DiscoveryTourDetail.jsx`
- `backend/tests/marketplaceEngagementApi.test.js`

---

### Task 1: Add Published Availability Support And Operations/Health Utilities

**Files:**
- Modify: `backend/models/TourPackage.js`
- Modify: `backend/utils/marketplaceAvailability.js`
- Create: `backend/utils/marketplaceAvailabilityOperations.js`
- Create: `backend/utils/marketplaceAvailabilityHealth.js`
- Test: `backend/tests/marketplaceAvailabilityOperations.test.js`

- [ ] **Step 1: Write the failing backend utility tests**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMarketplaceAvailabilityRows,
  buildMarketplaceAvailabilityHealth,
} from "../utils/marketplaceAvailabilityOperations.js";

test("buildMarketplaceAvailabilityRows skips unpublished entries and flattens rows", () => {
  const rows = buildMarketplaceAvailabilityRows([
    {
      _id: "tour1",
      title: "Migration Safari",
      location: "Serengeti",
      isMarketplaceVisible: true,
      marketplaceAvailability: [
        { date: "2026-07-10", status: "available", remainingSpots: 4, published: true },
        { date: "2026-07-17", status: "limited", remainingSpots: 1, published: false },
      ],
      marketplaceAvailabilitySettings: { instantBookingEnabled: true },
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].dateKey, "2026-07-10");
  assert.equal(rows[0].instantReady, true);
});

test("buildMarketplaceAvailabilityHealth flags visible tours without published departures", () => {
  const warnings = buildMarketplaceAvailabilityHealth([
    {
      _id: "tour2",
      title: "Zanzibar Escape",
      isMarketplaceVisible: true,
      marketplaceAvailability: [],
      marketplaceAvailabilitySettings: { instantBookingEnabled: false },
    },
  ]);

  assert.equal(warnings[0].reason, "missing-published-dates");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test backend/tests/marketplaceAvailabilityOperations.test.js`

Expected: FAIL with module-not-found or missing export errors for the new utility functions.

- [ ] **Step 3: Add the model field and minimal utility implementations**

```js
// backend/models/TourPackage.js
const marketplaceAvailabilitySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["available", "limited", "unavailable", "on-request"],
    default: "available",
  },
  published: { type: Boolean, default: true },
  remainingSpots: { type: Number, default: null },
  note: { type: String, default: "" },
}, { _id: false });
```

```js
// backend/utils/marketplaceAvailability.js
const isPublishedEntry = (entry = {}) => entry?.published !== false;

const manualEntries = toArray(tour.marketplaceAvailability)
  .filter((entry) => isPublishedEntry(entry))
  .map((entry) => {
    const date = isoDate(entry?.date);
    if (!date) return null;
    return {
      date,
      status: entry?.status || "available",
      published: entry?.published !== false,
      remainingSpots: deriveRemainingSpots(tour, entry || {}, settings),
      note: entry?.note || "",
      source: "manual",
    };
  })
  .filter(Boolean);
```

```js
// backend/utils/marketplaceAvailabilityOperations.js
import { buildAvailabilitySummary, computeAvailabilityEntries } from "./marketplaceAvailability.js";
import { buildMarketplaceAvailabilityHealth } from "./marketplaceAvailabilityHealth.js";

export const buildMarketplaceAvailabilityRows = (tours = []) =>
  (tours || []).flatMap((tour) => {
    const entries = computeAvailabilityEntries(tour);
    return entries.map((entry) => ({
      tourId: String(tour._id || ""),
      dateKey: String(entry.date || "").slice(0, 10),
      packageTitle: tour.title || "",
      location: tour.location || "",
      status: entry.status,
      source: entry.source || "manual",
      remainingSpots: entry.remainingSpots,
      note: entry.note || "",
      requestOnly: entry.requestState === true,
      instantReady: entry.instantBookable === true,
      bookable: entry.bookable === true,
    }));
  });

export { buildMarketplaceAvailabilityHealth };
```

```js
// backend/utils/marketplaceAvailabilityHealth.js
import { buildAvailabilitySummary } from "./marketplaceAvailability.js";

export const buildMarketplaceAvailabilityHealth = (tours = []) =>
  (tours || []).flatMap((tour) => {
    const summary = buildAvailabilitySummary(tour);
    const warnings = [];

    if (tour.isMarketplaceVisible === true && summary.hasPublishedDates !== true) {
      warnings.push({
        tourId: String(tour._id || ""),
        reason: "missing-published-dates",
        severity: "high",
      });
    }

    if (
      tour.marketplaceAvailabilitySettings?.instantBookingEnabled === true &&
      !summary.nextInstantBookableDate
    ) {
      warnings.push({
        tourId: String(tour._id || ""),
        reason: "instant-booking-blocked",
        severity: "medium",
      });
    }

    return warnings;
  });
```

- [ ] **Step 4: Run the utility test to verify it passes**

Run: `node --test backend/tests/marketplaceAvailabilityOperations.test.js`

Expected: PASS for row flattening and health warning coverage.

- [ ] **Step 5: Commit**

```bash
git add backend/models/TourPackage.js backend/utils/marketplaceAvailability.js backend/utils/marketplaceAvailabilityOperations.js backend/utils/marketplaceAvailabilityHealth.js backend/tests/marketplaceAvailabilityOperations.test.js
git commit -m "feat: add marketplace availability operations utilities"
```

### Task 2: Add Availability Operations Routes And Bulk Update Logic

**Files:**
- Modify: `backend/routes/marketplaceEngagementRoutes.js`
- Test: `backend/tests/marketplaceAvailabilityRoutes.test.js`

- [ ] **Step 1: Write failing route-helper tests for CRUD and bulk updates**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  addMarketplaceAvailabilityEntry,
  bulkUpdateMarketplaceAvailability,
  updateMarketplaceAvailabilityEntry,
} from "../routes/marketplaceEngagementRoutes.js";

test("updateMarketplaceAvailabilityEntry patches one date by dateKey", async () => {
  const updated = await updateMarketplaceAvailabilityEntry({
    tour: {
      marketplaceAvailability: [
        { date: "2026-07-10", status: "available", remainingSpots: 4, published: true },
      ],
    },
    dateKey: "2026-07-10",
    patch: { status: "limited", remainingSpots: 2 },
  });

  assert.equal(updated.marketplaceAvailability[0].status, "limited");
  assert.equal(updated.marketplaceAvailability[0].remainingSpots, 2);
});

test("bulkUpdateMarketplaceAvailability applies status to selected rows only", async () => {
  const updated = await bulkUpdateMarketplaceAvailability({
    tours: [
      {
        _id: "tour1",
        marketplaceAvailability: [
          { date: "2026-07-10", status: "available", published: true },
          { date: "2026-07-17", status: "available", published: true },
        ],
      },
    ],
    selection: [{ tourId: "tour1", dateKey: "2026-07-17" }],
    action: { type: "set-status", status: "on-request" },
  });

  assert.equal(updated[0].marketplaceAvailability[0].status, "available");
  assert.equal(updated[0].marketplaceAvailability[1].status, "on-request");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test backend/tests/marketplaceAvailabilityRoutes.test.js`

Expected: FAIL because the helper exports and routes do not exist yet.

- [ ] **Step 3: Implement helper functions and wire the new routes**

```js
// backend/routes/marketplaceEngagementRoutes.js
export const updateMarketplaceAvailabilityEntry = async ({ tour, dateKey, patch }) => {
  const nextEntries = (tour.marketplaceAvailability || []).map((entry) =>
    String(entry.date).slice(0, 10) === dateKey
      ? { ...entry, ...patch }
      : entry
  );

  return { ...tour, marketplaceAvailability: nextEntries };
};

export const addMarketplaceAvailabilityEntry = async ({ tour, entry }) => ({
  ...tour,
  marketplaceAvailability: [...(tour.marketplaceAvailability || []), entry],
});

export const bulkUpdateMarketplaceAvailability = async ({ tours, selection, action }) => {
  const selected = new Set((selection || []).map((item) => `${item.tourId}:${item.dateKey}`));

  return (tours || []).map((tour) => ({
    ...tour,
    marketplaceAvailability: (tour.marketplaceAvailability || []).map((entry) => {
      const rowKey = `${tour._id}:${String(entry.date).slice(0, 10)}`;
      if (!selected.has(rowKey)) return entry;

      if (action.type === "set-status") {
        return { ...entry, status: action.status };
      }
      if (action.type === "set-published") {
        return { ...entry, published: action.published === true };
      }
      if (action.type === "adjust-spots") {
        return { ...entry, remainingSpots: Number(entry.remainingSpots || 0) + Number(action.delta || 0) };
      }
      if (action.type === "set-note") {
        return { ...entry, note: action.note || "" };
      }

      return entry;
    }),
  }));
};
```

```js
// backend/routes/marketplaceEngagementRoutes.js
router.get("/availability/operations", requireTenantAdmin, async (req, res) => {
  const tours = await TourPackage.find({ tenantId: req.tenantId }).lean();
  res.status(200).json({
    rows: buildMarketplaceAvailabilityRows(tours),
    health: buildMarketplaceAvailabilityHealth(tours),
  });
});

router.get("/availability/tours/:id", requireTenantAdmin, async (req, res) => {
  const tour = await TourPackage.findOne({ _id: req.params.id, tenantId: req.tenantId }).lean();
  if (!tour) return res.status(404).json({ message: "Tour not found." });
  res.status(200).json({ tour });
});
```

- [ ] **Step 4: Run the route-helper tests**

Run: `node --test backend/tests/marketplaceAvailabilityRoutes.test.js backend/tests/marketplaceAvailabilityOperations.test.js`

Expected: PASS for entry patching and bulk mutation behavior.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/marketplaceEngagementRoutes.js backend/tests/marketplaceAvailabilityRoutes.test.js
git commit -m "feat: add marketplace availability operations routes"
```

### Task 3: Add Frontend API Helpers And Pure State Utilities

**Files:**
- Modify: `src/services/api.js`
- Create: `src/components/Admin/MarketplaceAvailability/availabilityManagerState.js`
- Test: `src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js`

- [ ] **Step 1: Write the failing frontend state tests**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  applyAvailabilityFilters,
  buildBulkAvailabilityPayload,
  toggleAvailabilitySelection,
} from "./availabilityManagerState.js";

test("applyAvailabilityFilters narrows rows by status and month", () => {
  const rows = [
    { tourId: "tour1", dateKey: "2026-07-10", status: "available", packageTitle: "Safari" },
    { tourId: "tour2", dateKey: "2026-08-12", status: "on-request", packageTitle: "Beach" },
  ];

  const filtered = applyAvailabilityFilters(rows, {
    status: "available",
    departureMonth: "2026-07",
    search: "",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].tourId, "tour1");
});

test("buildBulkAvailabilityPayload serializes selected rows and action", () => {
  const payload = buildBulkAvailabilityPayload({
    selectedRows: [{ tourId: "tour1", dateKey: "2026-07-10" }],
    action: { type: "set-status", status: "limited" },
  });

  assert.deepEqual(payload.selection, [{ tourId: "tour1", dateKey: "2026-07-10" }]);
  assert.equal(payload.action.status, "limited");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js`

Expected: FAIL because the new state module does not exist yet.

- [ ] **Step 3: Implement the minimal state helpers and API methods**

```js
// src/components/Admin/MarketplaceAvailability/availabilityManagerState.js
export const applyAvailabilityFilters = (rows = [], filters = {}) =>
  (rows || []).filter((row) => {
    if (filters.status && row.status !== filters.status) return false;
    if (filters.departureMonth && !String(row.dateKey || "").startsWith(filters.departureMonth)) return false;
    if (filters.search) {
      const haystack = `${row.packageTitle || ""} ${row.location || ""}`.toLowerCase();
      if (!haystack.includes(String(filters.search).trim().toLowerCase())) return false;
    }
    return true;
  });

export const toggleAvailabilitySelection = (selectedRows = [], row) => {
  const key = `${row.tourId}:${row.dateKey}`;
  const exists = selectedRows.some((item) => `${item.tourId}:${item.dateKey}` === key);
  return exists
    ? selectedRows.filter((item) => `${item.tourId}:${item.dateKey}` !== key)
    : [...selectedRows, { tourId: row.tourId, dateKey: row.dateKey }];
};

export const buildBulkAvailabilityPayload = ({ selectedRows = [], action }) => ({
  selection: selectedRows,
  action,
});
```

```js
// src/services/api.js
export const fetchMarketplaceAvailabilityOperations = (params = {}) =>
  API.get("/marketplace/availability/operations", { params });

export const fetchMarketplaceAvailabilityTourSchedule = (tourId) =>
  API.get(`/marketplace/availability/tours/${tourId}`);

export const createMarketplaceAvailabilityEntry = (tourId, payload) =>
  API.post(`/marketplace/availability/tours/${tourId}/entries`, payload);

export const updateMarketplaceAvailabilityEntry = (tourId, dateKey, payload) =>
  API.patch(`/marketplace/availability/tours/${tourId}/entries/${encodeURIComponent(dateKey)}`, payload);

export const deleteMarketplaceAvailabilityEntry = (tourId, dateKey) =>
  API.delete(`/marketplace/availability/tours/${tourId}/entries/${encodeURIComponent(dateKey)}`);

export const bulkUpdateMarketplaceAvailability = (payload) =>
  API.post("/marketplace/availability/bulk-update", payload);
```

- [ ] **Step 4: Run the frontend utility test**

Run: `node --test src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js`

Expected: PASS for filtering and bulk payload construction.

- [ ] **Step 5: Commit**

```bash
git add src/services/api.js src/components/Admin/MarketplaceAvailability/availabilityManagerState.js src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js
git commit -m "feat: add marketplace availability frontend state helpers"
```

### Task 4: Build The Availability Workspace UI And Admin Integration

**Files:**
- Create: `src/components/Admin/MarketplaceAvailability/MarketplaceAvailabilityManager.jsx`
- Create: `src/components/Admin/MarketplaceAvailability/AvailabilityFiltersBar.jsx`
- Create: `src/components/Admin/MarketplaceAvailability/AvailabilityOperationsTable.jsx`
- Create: `src/components/Admin/MarketplaceAvailability/TourScheduleDrawer.jsx`
- Create: `src/components/Admin/MarketplaceAvailability/AvailabilityHealthPanel.jsx`
- Modify: `src/components/Admin/AdminSidebar.jsx`
- Modify: `src/pages/AdminDashboard.jsx`
- Test: `src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js`

- [ ] **Step 1: Add a lightweight failing integration expectation to the state test file**

```js
test("toggleAvailabilitySelection adds and removes the same row key", () => {
  const row = { tourId: "tour1", dateKey: "2026-07-10" };
  const selected = toggleAvailabilitySelection([], row);
  const deselected = toggleAvailabilitySelection(selected, row);

  assert.equal(selected.length, 1);
  assert.equal(deselected.length, 0);
});
```

- [ ] **Step 2: Run the state test to verify the new assertion fails if toggle logic is missing**

Run: `node --test src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js`

Expected: FAIL until the selection helper supports add/remove symmetry.

- [ ] **Step 3: Implement the UI skeleton and admin mounting**

```jsx
// src/components/Admin/MarketplaceAvailability/MarketplaceAvailabilityManager.jsx
import { useEffect, useMemo, useState } from "react";
import {
  bulkUpdateMarketplaceAvailability,
  fetchMarketplaceAvailabilityOperations,
  fetchMarketplaceAvailabilityTourSchedule,
} from "../../../services/api";
import {
  applyAvailabilityFilters,
  buildBulkAvailabilityPayload,
  toggleAvailabilitySelection,
} from "./availabilityManagerState.js";
import AvailabilityFiltersBar from "./AvailabilityFiltersBar.jsx";
import AvailabilityOperationsTable from "./AvailabilityOperationsTable.jsx";
import AvailabilityHealthPanel from "./AvailabilityHealthPanel.jsx";
import TourScheduleDrawer from "./TourScheduleDrawer.jsx";

export default function MarketplaceAvailabilityManager() {
  const [rows, setRows] = useState([]);
  const [health, setHealth] = useState([]);
  const [filters, setFilters] = useState({ status: "", departureMonth: "", search: "" });
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeTourId, setActiveTourId] = useState("");

  useEffect(() => {
    fetchMarketplaceAvailabilityOperations().then((response) => {
      setRows(response.data?.rows || []);
      setHealth(response.data?.health || []);
    });
  }, []);

  const filteredRows = useMemo(() => applyAvailabilityFilters(rows, filters), [rows, filters]);

  return (
    <section className="space-y-6">
      <AvailabilityFiltersBar filters={filters} onChange={setFilters} />
      <AvailabilityHealthPanel warnings={health} onOpenTour={setActiveTourId} />
      <AvailabilityOperationsTable
        rows={filteredRows}
        selectedRows={selectedRows}
        onToggleRow={(row) => setSelectedRows((current) => toggleAvailabilitySelection(current, row))}
        onOpenTour={setActiveTourId}
      />
      <TourScheduleDrawer tourId={activeTourId} onClose={() => setActiveTourId("")} />
    </section>
  );
}
```

```jsx
// src/components/Admin/AdminSidebar.jsx
{ id: "marketplace-availability", label: "Marketplace Availability", icon: <FaCalendarCheck /> }
```

```jsx
// src/pages/AdminDashboard.jsx
import MarketplaceAvailabilityManager from "../components/Admin/MarketplaceAvailability/MarketplaceAvailabilityManager";

{activeTab === "marketplace-availability" && <MarketplaceAvailabilityManager />}
```

- [ ] **Step 4: Re-run the state tests and full build**

Run: `node --test src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js`

Expected: PASS for filter and selection behavior.

Run: `npm run build`

Expected: PASS with the new admin workspace mounted.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/MarketplaceAvailability src/components/Admin/AdminSidebar.jsx src/pages/AdminDashboard.jsx
git commit -m "feat: add marketplace availability admin workspace"
```

### Task 5: Add Bulk Actions And Per-Tour Schedule Editing

**Files:**
- Create: `src/components/Admin/MarketplaceAvailability/AvailabilityBulkActionsBar.jsx`
- Modify: `src/components/Admin/MarketplaceAvailability/MarketplaceAvailabilityManager.jsx`
- Modify: `src/components/Admin/MarketplaceAvailability/TourScheduleDrawer.jsx`
- Test: `src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js`

- [ ] **Step 1: Add a failing bulk-action payload test**

```js
test("buildBulkAvailabilityPayload keeps seat adjustments and selected keys together", () => {
  const payload = buildBulkAvailabilityPayload({
    selectedRows: [{ tourId: "tour1", dateKey: "2026-07-10" }],
    action: { type: "adjust-spots", delta: -2 },
  });

  assert.equal(payload.action.type, "adjust-spots");
  assert.equal(payload.action.delta, -2);
});
```

- [ ] **Step 2: Run the test to verify it fails if the action shape is incomplete**

Run: `node --test src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js`

Expected: FAIL until the payload builder preserves the action object exactly.

- [ ] **Step 3: Implement the bulk bar and drawer save flows**

```jsx
// src/components/Admin/MarketplaceAvailability/AvailabilityBulkActionsBar.jsx
export default function AvailabilityBulkActionsBar({
  selectedCount,
  onApplyStatus,
  onAdjustSpots,
  onSetPublished,
  onSetNote,
}) {
  if (!selectedCount) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {selectedCount} departures selected
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => onApplyStatus("available")}>Mark Available</button>
        <button type="button" onClick={() => onApplyStatus("on-request")}>Mark Request Only</button>
        <button type="button" onClick={() => onSetPublished(false)}>Unpublish</button>
        <button type="button" onClick={() => onAdjustSpots(-1)}>Reduce Spots</button>
      </div>
    </div>
  );
}
```

```jsx
// src/components/Admin/MarketplaceAvailability/MarketplaceAvailabilityManager.jsx
const applyBulkAction = async (action) => {
  const payload = buildBulkAvailabilityPayload({ selectedRows, action });
  await bulkUpdateMarketplaceAvailability(payload);
  const response = await fetchMarketplaceAvailabilityOperations();
  setRows(response.data?.rows || []);
  setHealth(response.data?.health || []);
  setSelectedRows([]);
};
```

- [ ] **Step 4: Run the state test and full build**

Run: `node --test src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js`

Expected: PASS for bulk payload shape and selection behavior.

Run: `npm run build`

Expected: PASS with the bulk actions bar and drawer editing flow.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/MarketplaceAvailability/AvailabilityBulkActionsBar.jsx src/components/Admin/MarketplaceAvailability/MarketplaceAvailabilityManager.jsx src/components/Admin/MarketplaceAvailability/TourScheduleDrawer.jsx
git commit -m "feat: add marketplace availability bulk actions"
```

### Task 6: Final Verification And Tracker Update

**Files:**
- Modify: `README.md`
- Modify: `backend/tests/marketplaceEngagementApi.test.js`
- Test: `backend/tests/marketplaceAvailabilityOperations.test.js`
- Test: `backend/tests/marketplaceAvailabilityRoutes.test.js`
- Test: `src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js`

- [ ] **Step 1: Extend the marketplace tracker and verification note**

```md
### Marketplace Completed
- Dedicated tenant-admin marketplace availability operations workspace
- Cross-tour departure table with hybrid guaranteed/request-only management
- Per-tour schedule drawer and bulk marketplace availability actions
```

- [ ] **Step 2: Add one final snapshot regression test**

```js
test("buildMarketplaceOperationsSnapshot reflects next published date after unpublished entries are ignored", () => {
  const snapshot = buildMarketplaceOperationsSnapshot({
    tours: [
      {
        _id: "tour9",
        title: "Northern Circuit",
        isMarketplaceVisible: true,
        marketplaceAvailability: [
          { date: "2026-07-10", status: "available", published: false },
          { date: "2026-07-12", status: "limited", published: true, remainingSpots: 2 },
        ],
        marketplaceAvailabilitySettings: { instantBookingEnabled: true },
      },
    ],
  });

  assert.equal(snapshot.packages[0].nextPublishedDate.slice(0, 10), "2026-07-12");
});
```

- [ ] **Step 3: Run the full verification set**

Run:

```bash
node --test backend/tests/marketplaceAvailabilityOperations.test.js backend/tests/marketplaceAvailabilityRoutes.test.js backend/tests/marketplaceEngagementApi.test.js src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js
npm run build
```

Expected:

- all tests PASS
- build PASS

- [ ] **Step 4: Commit**

```bash
git add README.md backend/tests/marketplaceEngagementApi.test.js backend/tests/marketplaceAvailabilityOperations.test.js backend/tests/marketplaceAvailabilityRoutes.test.js src/components/Admin/MarketplaceAvailability/availabilityManagerState.test.js
git commit -m "docs: track marketplace availability workspace rollout"
```

## Self-Review

### Spec coverage

- dedicated availability workspace: covered in Tasks 3-5
- operations table: covered in Task 4
- per-tour schedule drawer: covered in Tasks 4-5
- filters and search: covered in Task 3 and Task 4
- quick row editing: covered in Task 2 and Task 4
- health warnings: covered in Task 1 and Task 4
- bulk status and seat changes: covered in Task 2 and Task 5
- reuse of embedded model: covered in Task 1 and Task 2

No spec gaps remain.

### Placeholder scan

- removed generic instructions like “add validation later”
- every task includes named files, concrete test snippets, commands, and commit steps
- no `TBD` or deferred placeholders remain

### Type consistency

- model field: `published`
- row identity: `tourId` + `dateKey`
- bulk payload shape: `{ selection, action }`
- frontend helper names are consistent across tasks

No naming contradictions remain.
