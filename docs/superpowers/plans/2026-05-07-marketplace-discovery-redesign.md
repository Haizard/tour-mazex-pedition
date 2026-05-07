# Marketplace Discovery Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the public marketplace discover experience into a stronger travel-discovery product and expose marketplace/distribution visibility controls in both the tenant tour form and a tenant bulk manager.

**Architecture:** Extend the existing discovery API to support richer filtering, sorting, and payload shaping while preserving the current Mongo-backed tour model. Update the tenant admin tour workflow to persist `isMarketplaceVisible` and `isPubliclyDistributable`, then add a focused bulk-management surface in the distribution area. Finally, rebuild the public `/discover` and `/discover/tour/:id` pages around denser, trust-oriented marketplace scanning without copying TripAdvisor branding or layout.

**Tech Stack:** React 18, React Router, Express, Mongoose, Vite, node:test

---

### Task 1: Lock discovery route behavior with tests

**Files:**
- Modify: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/backend/tests/discoveryApi.test.js`
- Modify: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/backend/routes/discoveryRoutes.js`
- Test: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/backend/tests/discoveryApi.test.js`

- [ ] **Step 1: Write the failing tests**

```js
test("discovery list returns only marketplace-visible tours", async () => {
  // Seed one visible and one hidden tour
  // Request /api/discovery/tours
  // Expect only the visible tour in the response
});

test("discovery list supports category, operator, duration, and sort filters", async () => {
  // Seed tours with different categories, operators, durations, and prices
  // Request /api/discovery/tours?category=Safari&operator=tenant-slug&sort=price-asc
  // Expect the filtered and ordered subset
});

test("discovery detail rejects tours that are not marketplace visible", async () => {
  // Seed one hidden tour
  // Request /api/discovery/tours/:id
  // Expect 404
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/discoveryApi.test.js`
Expected: FAIL because the current route does not yet support the full filter/sort contract and payload expectations.

- [ ] **Step 3: Write minimal implementation**

```js
const buildDiscoveryQuery = ({ q, location, minPrice, maxPrice, category, operator, duration }) => {
  const query = { isMarketplaceVisible: true };
  // add regex filters and price filters
  return query;
};

const buildDiscoverySort = (sort = "") => {
  if (sort === "price-asc") return { price: 1 };
  if (sort === "price-desc") return { price: -1 };
  if (sort === "featured") return { featured: -1, createdAt: -1 };
  return { featured: -1, createdAt: -1 };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/discoveryApi.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/tests/discoveryApi.test.js backend/routes/discoveryRoutes.js
git commit -m "feat: expand discovery route filtering and visibility rules"
```

### Task 2: Enrich discovery API payload for marketplace cards

**Files:**
- Modify: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/backend/routes/discoveryRoutes.js`
- Test: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/backend/tests/discoveryApi.test.js`

- [ ] **Step 1: Write the failing test**

```js
test("discovery list returns marketplace card fields for operator and review context", async () => {
  // Seed a visible tour with tripAdvisorRating/review count and a tenant
  // Expect title, location, duration, category, featured, operator slug/name, tripAdvisor fields
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/discoveryApi.test.js`
Expected: FAIL because the route currently returns raw tours without a normalized marketplace card shape.

- [ ] **Step 3: Write minimal implementation**

```js
const toDiscoveryCard = (tour = {}) => ({
  _id: String(tour._id),
  title: tour.title || "",
  description: tour.description || "",
  image: tour.image || "",
  location: tour.location || "",
  duration: tour.duration || "",
  category: tour.category || "",
  price: Number(tour.price || 0),
  featured: tour.featured === true,
  operator: {
    id: tour.tenantId?._id ? String(tour.tenantId._id) : "",
    name: tour.tenantId?.name || "Verified Operator",
    slug: tour.tenantId?.slug || "",
  },
  tripAdvisorRating: tour.tripAdvisorRating || null,
  tripAdvisorReviewCount: tour.tripAdvisorReviewCount || null,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/tests/discoveryApi.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/routes/discoveryRoutes.js backend/tests/discoveryApi.test.js
git commit -m "feat: enrich discovery payload for marketplace cards"
```

### Task 3: Expose visibility flags in the tenant tour editor

**Files:**
- Modify: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/src/pages/AdminDashboard.jsx`
- Test: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/src/pages/AdminDashboard.jsx`

- [ ] **Step 1: Write the failing test**

```js
// If no component test harness exists, add a narrow assertion in existing admin-dashboard tests
// or document a manual verification script in this task:
// - open a tour in the tenant admin
// - expect "Show on Marketplace" and "Allow Distribution Partners" toggles
// - save tour
// - reload and expect persisted values
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: Existing build still passes, but manual verification fails because the toggles are not present in the form.

- [ ] **Step 3: Write minimal implementation**

```jsx
<label>
  <span>Show on Marketplace</span>
  <input
    type="checkbox"
    name="isMarketplaceVisible"
    checked={tourFormData.isMarketplaceVisible}
    onChange={handleTourInputChange}
  />
</label>

<label>
  <span>Allow Distribution Partners</span>
  <input
    type="checkbox"
    name="isPubliclyDistributable"
    checked={tourFormData.isPubliclyDistributable}
    onChange={handleTourInputChange}
  />
</label>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS, and manual verification shows the toggles in the tenant tour form and persists them through create/update.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AdminDashboard.jsx
git commit -m "feat: add marketplace visibility controls to tour editor"
```

### Task 4: Add tenant bulk marketplace visibility manager

**Files:**
- Create: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/src/components/Admin/MarketplaceVisibilityManager.jsx`
- Modify: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/src/pages/AdminDashboard.jsx`
- Modify: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/src/services/api.js`
- Test: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/src/components/Admin/MarketplaceVisibilityManager.jsx`

- [ ] **Step 1: Write the failing test**

```js
// Manual verification contract for this task:
// - Distribution tab shows a marketplace visibility table
// - Table lists title, location, price, marketplace status, distributable status
// - Toggling a row updates the tour and refreshes the table
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: PASS build, but manual verification fails because no bulk manager exists yet.

- [ ] **Step 3: Write minimal implementation**

```jsx
const MarketplaceVisibilityManager = ({ tours, onToggle }) => {
  const [query, setQuery] = useState("");
  const visibleTours = tours.filter((tour) =>
    `${tour.title} ${tour.location} ${tour.category}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} />
      {visibleTours.map((tour) => (
        <div key={tour._id}>
          <span>{tour.title}</span>
          <button onClick={() => onToggle(tour._id, "isMarketplaceVisible", !tour.isMarketplaceVisible)} />
          <button onClick={() => onToggle(tour._id, "isPubliclyDistributable", !tour.isPubliclyDistributable)} />
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS, and manual verification confirms bulk visibility management is available from the tenant distribution area.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/MarketplaceVisibilityManager.jsx src/pages/AdminDashboard.jsx src/services/api.js
git commit -m "feat: add bulk marketplace visibility manager"
```

### Task 5: Redesign GlobalDiscovery into a denser marketplace page

**Files:**
- Modify: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/src/pages/GlobalDiscovery.jsx`
- Test: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/src/pages/GlobalDiscovery.jsx`

- [ ] **Step 1: Write the failing test**

```js
// Manual verification contract:
// - discover page shows richer filter header
// - cards show operator, duration, category, trust/review context
// - layout feels marketplace-grade and not like the current simple grid
// - design is original and not copied from TripAdvisor
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: PASS build, but manual verification fails because the current page is still the old simple hero + grid.

- [ ] **Step 3: Write minimal implementation**

```jsx
// Replace the current hero/grid with:
// - search/filter rail
// - results summary strip
// - featured block
// - richer cards with operator and review snapshot
// - sort control and polished empty/loading states
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS, and manual verification confirms the new marketplace layout works on desktop and mobile.

- [ ] **Step 5: Commit**

```bash
git add src/pages/GlobalDiscovery.jsx
git commit -m "feat: redesign marketplace discovery page"
```

### Task 6: Improve discovery detail page trust framing

**Files:**
- Modify: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/src/pages/DiscoveryTourDetail.jsx`
- Test: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/src/pages/DiscoveryTourDetail.jsx`

- [ ] **Step 1: Write the failing test**

```js
// Manual verification contract:
// - detail page shows stronger operator trust block
// - review snapshot is visible when data exists
// - inquiry CTA remains clear
// - page remains original to MAZ branding
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: PASS build, but manual verification fails because the current detail page lacks the stronger marketplace trust framing.

- [ ] **Step 3: Write minimal implementation**

```jsx
// Add:
// - operator summary card
// - review snapshot panel
// - marketplace badges / verified cues
// - related experience section using same operator or category
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS, and manual verification confirms the detail page better supports marketplace trust and conversion.

- [ ] **Step 5: Commit**

```bash
git add src/pages/DiscoveryTourDetail.jsx
git commit -m "feat: strengthen marketplace tour detail trust blocks"
```

### Task 7: Final regression verification

**Files:**
- Modify: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/backend/tests/discoveryApi.test.js`
- Modify: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/docs/superpowers/specs/2026-05-07-marketplace-discovery-redesign-design.md`
- Test: `C:/Users/SFG DESIGN/Desktop/tour-mazex-pedition/backend/tests/discoveryApi.test.js`

- [ ] **Step 1: Write final regression checks**

```js
test("hidden marketplace tours are excluded after bulk visibility updates", async () => {
  // Toggle a tour off, fetch discovery list, expect it absent
});
```

- [ ] **Step 2: Run targeted tests**

Run: `node --test backend/tests/discoveryApi.test.js`
Expected: PASS

- [ ] **Step 3: Run full verification**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Manual QA checklist**

```text
1. Open tenant admin and edit a tour.
2. Confirm both visibility toggles are present and save correctly.
3. Open distribution area and confirm bulk visibility manager works.
4. Open /discover and verify richer filters, cards, sections, and operator context.
5. Open /discover/tour/:id and verify trust block plus CTA still works.
6. Hide a tour and confirm it disappears from /discover.
```

- [ ] **Step 5: Commit**

```bash
git add backend/tests/discoveryApi.test.js
git commit -m "test: cover marketplace visibility regression flow"
```

## Self-Review

### Spec coverage

- Dual visibility control in tour form: Task 3
- Bulk visibility manager: Task 4
- Discovery API enhancement: Tasks 1 and 2
- Discover page redesign: Task 5
- Discovery detail trust improvements: Task 6
- Regression coverage and validation: Task 7

### Placeholder scan

- No TODO/TBD markers remain.
- Each task contains explicit files, commands, and expected outcomes.
- UI-heavy tasks use concrete manual verification contracts where no component test harness is established in the current codebase.

### Type consistency

- Visibility fields are consistently named `isMarketplaceVisible` and `isPubliclyDistributable`.
- Discovery payload consistently uses operator `{ id, name, slug }`.
- Discovery route contract consistently centers on `/api/discovery/tours`.
