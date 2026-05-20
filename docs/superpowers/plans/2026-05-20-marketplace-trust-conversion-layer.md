# Marketplace Trust Conversion Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strengthen public marketplace trust and conversion on discovery and detail pages with a layered trust journey: compact fast-scan trust on discovery, then deeper operator credibility, traveler proof, and inquiry reassurance on detail.

**Architecture:** Keep this as a frontend-led marketplace presentation pass. Reuse the existing discovery payloads, review summary data, operator metadata, traveler photos/questions, and marketplace availability summaries. Add small reusable trust helpers and presentational components rather than changing marketplace data architecture.

**Tech Stack:** React + Vite, existing marketplace pages/components, Node test runner, existing build verification

---

## File Structure

### New frontend utilities and components

- Create: `src/components/Marketplace/marketplaceTrustUtils.js`
  - trust copy shaping
  - operator credibility labels
  - departure confidence labels
  - traveler proof summaries
- Create: `src/components/Marketplace/marketplaceTrustUtils.test.js`
  - pure utility coverage
- Create: `src/components/Marketplace/OperatorCredibilityCard.jsx`
  - dedicated operator trust module for detail pages
- Create: `src/components/Marketplace/TravelerProofCard.jsx`
  - dedicated traveler proof module for detail pages
- Create: `src/components/Marketplace/DepartureConfidenceBadge.jsx`
  - compact reusable departure confidence presentation for discovery and detail

### Existing frontend files to modify

- Modify: `src/pages/GlobalDiscovery.jsx`
  - discovery card trust hierarchy
  - featured block trust stack
  - clearer scan order and mobile trust presentation
- Modify: `src/pages/DiscoveryTourDetail.jsx`
  - insert operator credibility, traveler proof, and inquiry reassurance modules
  - improve trust staircase around inquiry flow
- Modify: `src/components/Marketplace/ReviewSummaryPanel.jsx`
  - make review evidence more scan-friendly and useful inside the traveler proof story
- Modify: `src/components/Marketplace/PublicReviewFeed.jsx`
  - tighten proof language and traveler evidence hierarchy

### Optional follow-up only if implementation reveals a real gap

- Modify: `src/services/api.js`
  - only if a tiny additive helper is needed for already-existing marketplace payloads

### Existing files to reference while implementing

- `src/components/Marketplace/TravelerPhotoGallery.jsx`
- `src/components/Marketplace/PackageQuestionsPanel.jsx`
- `src/pages/discoveryFilterUtils.js`
- `src/components/Marketplace/tripComparisonUtils.js`

---

## Implementation Strategy

Ship this in three tasks:

1. create trust utilities and shared trust presentation primitives
2. polish discovery trust for fast-scan confidence
3. deepen detail-page trust and inquiry reassurance

This keeps logic reusable and lets discovery/detail stay visually aligned.

---

### Task 1: Add reusable marketplace trust utilities and primitives

**Files:**
- Create: `src/components/Marketplace/marketplaceTrustUtils.js`
- Create: `src/components/Marketplace/marketplaceTrustUtils.test.js`
- Create: `src/components/Marketplace/DepartureConfidenceBadge.jsx`

- [ ] **Step 1: Write failing utility tests first**

Cover:
- operator credibility label generation
- departure confidence copy
- traveler proof summary copy
- graceful empty-state behavior

Example test targets:

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  getOperatorTrustLabel,
  getDepartureConfidenceCopy,
  getTravelerProofSummary,
} from "./marketplaceTrustUtils.js";

test("getDepartureConfidenceCopy prioritizes limited departures with remaining spots", () => {
  assert.equal(
    getDepartureConfidenceCopy({
      status: "limited",
      remainingSpots: 2,
      date: "2026-08-17",
    }),
    "Limited published departure on Aug 17 with 2 spots noted."
  );
});

test("getTravelerProofSummary returns a review-led summary when ratings exist", () => {
  assert.match(
    getTravelerProofSummary({
      averageRating: 4.8,
      reviewCount: 14,
      verificationBreakdown: { booking: 9, inquiry: 5 },
    }),
    /14 published reviews/i
  );
});
```

- [ ] **Step 2: Run the test and confirm the expected initial failure**

Run:

`node --test src/components/Marketplace/marketplaceTrustUtils.test.js`

Expected:
- module-not-found or missing export failure before implementation exists

- [ ] **Step 3: Implement pure trust helpers**

Helpers should stay deterministic and presentation-oriented.

Suggested exports:
- `getOperatorTrustLabel(tour)`
- `getOperatorTrustSupportCopy(tour)`
- `getDepartureConfidenceCopy(entry)`
- `getDepartureConfidenceTone(entry)`
- `getTravelerProofSummary(summary)`
- `getInquiryReassuranceCopy(tour, selectedAvailability)`

Guidelines:
- prefer evidence-led wording
- avoid vague labels like `Popular` or `Trusted` without nearby proof
- treat missing data as a softer fallback, not an error case

- [ ] **Step 4: Add `DepartureConfidenceBadge` as a small reusable display block**

This component should:
- accept the current availability entry
- use the helper copy/tone
- render consistently on discovery cards, featured blocks, and detail trust areas

- [ ] **Step 5: Run utility tests again**

Run:

`node --test src/components/Marketplace/marketplaceTrustUtils.test.js`

Expected:
- PASS

---

### Task 2: Polish discovery trust hierarchy on marketplace listing surfaces

**Files:**
- Modify: `src/pages/GlobalDiscovery.jsx`
- Reuse: `src/components/Marketplace/DepartureConfidenceBadge.jsx`
- Reuse: `src/components/Marketplace/marketplaceTrustUtils.js`

- [ ] **Step 1: Identify the trust-bearing discovery surfaces**

In `GlobalDiscovery.jsx`, update:
- the featured marketplace tour block
- standard marketplace trip cards
- mobile presentation where trust signals currently collapse awkwardly

Do not increase noise. The goal is stronger scan order, not more badges everywhere.

- [ ] **Step 2: Refactor trust rendering to use shared helpers**

For each discovery card:
- show operator trust first
- show traveler proof second
- show departure confidence third

Suggested trust stack:
- operator identity + verified marketplace wording
- rating + review count when present
- next departure confidence with remaining spots/status when present

For the featured block, allow a slightly richer version:
- operator credibility chip
- review density
- next departure confidence
- reassurance that inquiry stays with the listed operator

- [ ] **Step 3: Improve mobile scanning**

On small screens:
- trust rows should wrap cleanly
- confidence chips should not push CTA actions too far down
- avoid long copy walls inside cards

- [ ] **Step 4: Keep decorative labels subordinate to trust**

Reduce or demote low-signal decorative markers where they visually compete with:
- operator name
- review proof
- departure confidence

- [ ] **Step 5: Verify discovery still builds cleanly**

Run:

`npm run build`

Expected:
- PASS

---

### Task 3: Build the detail-page trust staircase and inquiry reassurance

**Files:**
- Create: `src/components/Marketplace/OperatorCredibilityCard.jsx`
- Create: `src/components/Marketplace/TravelerProofCard.jsx`
- Modify: `src/pages/DiscoveryTourDetail.jsx`
- Modify: `src/components/Marketplace/ReviewSummaryPanel.jsx`
- Modify: `src/components/Marketplace/PublicReviewFeed.jsx`

- [ ] **Step 1: Add the new trust modules**

`OperatorCredibilityCard.jsx` should present:
- operator identity
- marketplace-active reassurance
- fulfillment/ownership copy
- current departure signal or route-to-operator reassurance

`TravelerProofCard.jsx` should present:
- review summary snapshot
- verification mix summary
- traveler profile mix / common travel month highlights
- optional references to traveler photos/questions if present

- [ ] **Step 2: Insert the modules into `DiscoveryTourDetail.jsx` in trust-staircase order**

Recommended order:

1. trip value and route clarity
2. operator credibility
3. traveler proof
4. inquiry reassurance near the inquiry section

The page should make it obvious:
- who owns this trip
- that travelers have engaged with it
- what happens if the visitor sends an inquiry now

- [ ] **Step 3: Tighten inquiry reassurance copy**

Near the inquiry action surface:
- clarify who receives the inquiry
- clarify what `limited`, `available`, `on-request`, or `instant-confirmation` means
- remove ambiguous copy that sounds generic or marketplace-detached

- [ ] **Step 4: Make review proof easier to scan**

In `ReviewSummaryPanel.jsx`:
- keep the summary rich, but emphasize the most trust-relevant numbers first
- make verification mix feel operational, not decorative

In `PublicReviewFeed.jsx`:
- ensure each review communicates verification clearly
- keep traveler type/travel month evidence helpful but secondary

- [ ] **Step 5: Keep traveler proof tied to real available evidence**

If photos/questions/reviews are sparse:
- show calm fallback trust copy
- do not make the page feel empty or untrustworthy

- [ ] **Step 6: Run the shared utility tests and full build**

Run:

`node --test src/components/Marketplace/marketplaceTrustUtils.test.js`

Then:

`npm run build`

Expected:
- PASS

---

## UX Acceptance Checklist

- [ ] Discovery cards answer `Why should I click this one?` faster than before
- [ ] Discovery trust signals feel compact, not overcrowded
- [ ] Detail page clearly communicates operator ownership and marketplace routing
- [ ] Traveler proof is visible without forcing the user to dig
- [ ] Inquiry reassurance reduces ambiguity near conversion actions
- [ ] Mobile layouts keep trust readable and actionable

---

## Verification

### Required automated verification

- `node --test src/components/Marketplace/marketplaceTrustUtils.test.js`
- `npm run build`

### Required manual verification

Review these flows on desktop and mobile:
- discovery listing cards
- featured discovery block
- discovery detail hero and trust modules
- inquiry area and reassurance copy
- review summary + public review feed

Confirm the traveler can answer:
- who owns this trip?
- is this package actively published?
- do real travelers appear to have engaged with it?
- how confident is the departure signal?
- what happens if I inquire now?

---

## Notes For Implementation

- keep this phase frontend-first unless a genuine payload gap appears
- do not introduce new heavy marketplace metrics in this pass
- prefer a few stronger trust modules over many small decorative labels
- preserve the current marketplace aesthetic while improving hierarchy and scan speed
