# Hotel Claim And Self-Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hotel claim and self-registration flow that lets hotel owners or managers claim an existing hotel listing first, with new listing requests as a moderated fallback.

**Architecture:** Add a new `HotelClaimRequest` moderation layer between the public hotel claim experience and the approved `HotelPartnerAdmin` access model. Reuse the canonical `Hotel` entity, existing hotel partner portal, and tenant-admin review patterns so claims remain auditable and duplicate hotels stay under control.

**Tech Stack:** React, React Router, Express, MongoDB/Mongoose, Node test runner, existing tenant routing and hotel partner auth utilities.

---

## File Structure

### New backend files

- Create: `backend/models/HotelClaimRequest.js`
  - stores pending, approved, rejected, and needs-more-proof hotel claim requests
- Create: `backend/utils/hotelClaimFlow.js`
  - normalizes public claim payloads, shapes review actions, and creates partner admins from approved claims
- Create: `backend/tests/hotelClaimFlow.test.js`
  - validates claim normalization and approval behavior

### Backend files to modify

- Modify: `backend/routes/hotelRoutes.js`
  - add public hotel claim search and intake routes plus tenant-admin moderation routes
- Modify: `backend/server.js`
  - no new router if claims stay inside hotel routes; only verify route registration remains correct
- Modify: `backend/tests/hotelRoutes.test.js`
  - assert public claim and admin moderation endpoints exist

### New frontend files

- Create: `src/pages/HotelClaimPage.jsx`
  - public hotel claim and fallback new-listing request flow
- Create: `src/pages/hotelClaimPageState.js`
  - public flow helpers for search state, selected hotel, and request payload shaping
- Create: `src/pages/hotelClaimPageState.test.js`
  - validates public flow helper behavior
- Create: `src/components/Admin/HotelClaimManager.jsx`
  - admin moderation queue for pending hotel claim requests
- Create: `src/components/Admin/hotelClaimManagerState.js`
  - moderation helper logic
- Create: `src/components/Admin/hotelClaimManagerState.test.js`
  - validates moderation helper behavior

### Frontend files to modify

- Modify: `src/services/api.js`
  - add hotel claim search, submit, list, and review API helpers
- Modify: `src/pages/AdminDashboard.jsx`
  - add hotel claims panel/tab
- Modify: `src/components/Admin/AdminSidebar.jsx`
  - add hotel claims navigation entry
- Modify: `src/AppRoutes.jsx`
  - add public hotel claim page route
- Modify: `src/pages/HotelDiscovery.jsx`
  - add a “Claim your hotel” entry point
- Modify: `src/services/hotelPartnerApi.test.js`
  - assert new hotel claim API helpers exist

## Task 1: Claim Request Model And Flow Helpers

**Files:**
- Create: `backend/models/HotelClaimRequest.js`
- Create: `backend/utils/hotelClaimFlow.js`
- Create: `backend/tests/hotelClaimFlow.test.js`

- [ ] **Step 1: Write the failing model/helper tests**
- [ ] **Step 2: Run `node --test backend/tests/hotelClaimFlow.test.js` and verify failure**
- [ ] **Step 3: Implement the `HotelClaimRequest` model**
- [ ] **Step 4: Implement claim normalization and review helper utilities**
- [ ] **Step 5: Re-run `node --test backend/tests/hotelClaimFlow.test.js` and verify pass**
- [ ] **Step 6: Commit the claim foundation**

## Task 2: Public Claim Search And Submission Flow

**Files:**
- Modify: `backend/routes/hotelRoutes.js`
- Create: `src/pages/HotelClaimPage.jsx`
- Create: `src/pages/hotelClaimPageState.js`
- Create: `src/pages/hotelClaimPageState.test.js`
- Modify: `src/services/api.js`
- Modify: `src/AppRoutes.jsx`
- Modify: `src/pages/HotelDiscovery.jsx`
- Modify: `src/services/hotelPartnerApi.test.js`
- Modify: `backend/tests/hotelRoutes.test.js`

- [ ] **Step 1: Write the failing public flow tests**
- [ ] **Step 2: Run `node --test src/pages/hotelClaimPageState.test.js backend/tests/hotelRoutes.test.js src/services/hotelPartnerApi.test.js` and verify failure**
- [ ] **Step 3: Add public hotel claim search and submit routes**
- [ ] **Step 4: Add hotel claim API helpers**
- [ ] **Step 5: Build the public hotel claim page with existing-listing-first flow**
- [ ] **Step 6: Wire the public route and discovery CTA**
- [ ] **Step 7: Re-run `node --test src/pages/hotelClaimPageState.test.js backend/tests/hotelRoutes.test.js src/services/hotelPartnerApi.test.js` and verify pass**
- [ ] **Step 8: Commit the public claim slice**

## Task 3: Admin Claim Review And Approval

**Files:**
- Modify: `backend/routes/hotelRoutes.js`
- Create: `src/components/Admin/HotelClaimManager.jsx`
- Create: `src/components/Admin/hotelClaimManagerState.js`
- Create: `src/components/Admin/hotelClaimManagerState.test.js`
- Modify: `src/pages/AdminDashboard.jsx`
- Modify: `src/components/Admin/AdminSidebar.jsx`
- Modify: `backend/tests/hotelRoutes.test.js`

- [ ] **Step 1: Write the failing admin moderation tests**
- [ ] **Step 2: Run `node --test src/components/Admin/hotelClaimManagerState.test.js backend/tests/hotelRoutes.test.js` and verify failure**
- [ ] **Step 3: Add tenant-admin claim list and review routes**
- [ ] **Step 4: Implement approval logic that creates `HotelPartnerAdmin` on approval**
- [ ] **Step 5: Build the admin hotel claims manager UI**
- [ ] **Step 6: Wire hotel claims into admin navigation**
- [ ] **Step 7: Re-run `node --test src/components/Admin/hotelClaimManagerState.test.js backend/tests/hotelRoutes.test.js` and verify pass**
- [ ] **Step 8: Commit the moderation slice**

## Task 4: Full Verification And Cleanup

**Files:**
- Verify: `backend/tests/hotelClaimFlow.test.js`
- Verify: `backend/tests/hotelRoutes.test.js`
- Verify: `src/pages/hotelClaimPageState.test.js`
- Verify: `src/components/Admin/hotelClaimManagerState.test.js`
- Verify: `src/services/hotelPartnerApi.test.js`
- Verify: hotel-related existing tests still pass

- [ ] **Step 1: Run the targeted hotel claim suite**
- [ ] **Step 2: Run the broader hotel suite for regressions**
- [ ] **Step 3: Run `npm run build`**
- [ ] **Step 4: Fix regressions until tests and build pass**
- [ ] **Step 5: Commit the verification pass**

## Verification Commands

```bash
node --test backend/tests/hotelClaimFlow.test.js
node --test src/pages/hotelClaimPageState.test.js backend/tests/hotelRoutes.test.js src/services/hotelPartnerApi.test.js
node --test src/components/Admin/hotelClaimManagerState.test.js backend/tests/hotelRoutes.test.js
node --test backend/tests/postgresHotelRecords.test.js backend/tests/hotelMarketplace.test.js backend/tests/hotelAiConcierge.test.js backend/tests/hotelAnalytics.test.js backend/tests/postgresHotelVectorService.test.js src/components/Admin/hotelManagerState.test.js src/pages/hotelDiscoveryUtils.test.js src/components/Marketplace/hotelTrustUtils.test.js src/components/Marketplace/hotelInquiryUtils.test.js src/components/Marketplace/hotelConciergeState.test.js
npm run build
```

## Notes For The Implementer

- Keep `Hotel` canonical. Claims must attach to existing listings first whenever possible.
- New hotel creation is fallback only and must not auto-publish a marketplace listing.
- Reuse `HotelPartnerAdmin` for approved access; do not invent a second approved access model.
- Preserve claim review history in `HotelClaimRequest`; avoid destructive moderation updates.
- Stay within V1 claim scope. Do not drift into email verification, auto-approval, billing, inventory, or OTA sync work in this plan.
