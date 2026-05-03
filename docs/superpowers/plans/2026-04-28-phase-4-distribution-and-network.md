# Phase 4 Distribution And Network Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing trip-planning, chatbot, and partner features into real deployable distribution surfaces that work outside the main website.

**Architecture:** This phase reuses the current tenant-aware React and Express stack rather than inventing a separate channel product. We expose a distribution API that generates tenant-branded hosted and embeddable assets, extend inquiry attribution for external channels, and ship one embed route plus one admin distribution console so operators can publish and measure off-site lead capture immediately.

**Tech Stack:** React 18, Vite, Node.js, Express, MongoDB/Mongoose, tenant bootstrap flow, existing admin UI, existing inquiry pipeline

---

## File Structure

**Reference:**

- `docs/superpowers/plans/2026-04-28-tourism-infrastructure-master-roadmap.md`
- `src/components/PlanMyTrip/PlanMyTripWizard.jsx`
- `backend/routes/customInquiryRoutes.js`
- `backend/routes/partnerPortalRoutes.js`

**Create:**

- `docs/superpowers/plans/2026-04-28-phase-4-distribution-and-network.md`
- `backend/utils/distributionChannels.js`
- `backend/routes/distributionRoutes.js`
- `backend/tests/distributionChannels.test.js`
- `src/components/Admin/DistributionManager.jsx`
- `src/pages/EmbeddedPlanMyTrip.jsx`

**Modify:**

- `backend/models/CustomInquiry.js`
- `backend/server.js`
- `src/components/PlanMyTrip/PlanMyTripWizard.jsx`
- `src/pages/PlanMyTrip.jsx`
- `src/AppRoutes.jsx`
- `src/components/Admin/AdminSidebar.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/services/api.js`

---

## Task 1: Add channel-generation utilities

**Files:**

- Create: `backend/utils/distributionChannels.js`
- Create: `backend/tests/distributionChannels.test.js`

- [ ] **Step 1: Write failing tests for hosted links and embed snippets**
- [ ] **Step 2: Run the tests and watch them fail**
- [ ] **Step 3: Implement link and snippet builders for hosted social pages, embeddable planner routes, and partner referral links**
- [ ] **Step 4: Re-run the tests and make sure they pass**

---

## Task 2: Expose a tenant distribution API

**Files:**

- Create: `backend/routes/distributionRoutes.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Add an admin summary endpoint for generated links and snippets**
- [ ] **Step 2: Add a public bootstrap endpoint for embed-safe tenant branding**
- [ ] **Step 3: Smoke-test the route module**

---

## Task 3: Extend inquiry attribution for distribution channels

**Files:**

- Modify: `backend/models/CustomInquiry.js`
- Modify: `src/components/PlanMyTrip/PlanMyTripWizard.jsx`
- Modify: `src/pages/PlanMyTrip.jsx`
- Create: `src/pages/EmbeddedPlanMyTrip.jsx`
- Modify: `src/AppRoutes.jsx`

- [ ] **Step 1: Expand allowed inquiry source channels**
- [ ] **Step 2: Fix the planner referral-code regression and allow source, campaign, and referral defaults**
- [ ] **Step 3: Add an embeddable public route**
- [ ] **Step 4: Keep hosted social links on the main planner while preserving attribution**

---

## Task 4: Surface deployable assets in admin

**Files:**

- Create: `src/components/Admin/DistributionManager.jsx`
- Modify: `src/components/Admin/AdminSidebar.jsx`
- Modify: `src/pages/AdminDashboard.jsx`
- Modify: `src/services/api.js`

- [ ] **Step 1: Add API helpers for distribution endpoints**
- [ ] **Step 2: Build an admin console with copyable hosted links, embed snippet, and referral examples**
- [ ] **Step 3: Wire the new console into the dashboard**

---

## Task 5: Verify the Phase 4 tranche

**Files:**

- Verify: `backend/tests/distributionChannels.test.js`

- [ ] **Step 1: Run targeted backend tests**
- [ ] **Step 2: Run route smoke checks**
- [ ] **Step 3: Run targeted lint on the Phase 4 files**

---

## Handoff

This phase makes distribution operational. The next phase after this should build deeper partner-network workflows and commercial intelligence on top of these channel surfaces.
