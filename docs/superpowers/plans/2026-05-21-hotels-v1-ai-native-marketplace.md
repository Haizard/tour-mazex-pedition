# Hotels V1 AI-Native Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first AI-native `Hotels` marketplace slice with a canonical hotel entity, public hotel discovery/detail, tenant-admin hotel management, inquiry and itinerary-intent conversion, and database sync that follows the platform's MongoDB + PostgreSQL business-truth pattern.

**Architecture:** Introduce a canonical `Hotel` entity in MongoDB as the live write model and mirror it into normalized PostgreSQL hotel records. Reuse existing accommodation, partner, inquiry, discovery, trust, and AI/revenue patterns instead of creating a parallel hospitality stack. Ship Hotels first as a public discovery and operator-enabled lead product, not as a full OTA inventory engine.

**Tech Stack:** React, React Router, Express, MongoDB/Mongoose, PostgreSQL business-truth records, pgvector-ready metadata hooks, Node test runner, existing AI/chat/revenue infrastructure.

---

## Implementation Status - 2026-05-22

### Accomplished So Far

- Canonical `Hotel` marketplace entity exists in MongoDB with public discovery fields, partner linkage, publication flags, sponsored placement, ratings, trust summary, photos, geo, and pending partner profile review metadata.
- PostgreSQL hotel business-truth support exists through `hotel_records`, hotel record builders/lookups/views, and postgres-first hotel create/update helpers.
- Tenant-admin hotel management is available in the admin panel with create/edit/delete, marketplace visibility, publication, sponsored placement, and hotel partner admin onboarding.
- Accommodation operations now support `hotelId` linkage while preserving hotel-name fallback behavior.
- Separate hotel partner authentication and portal flows exist, with hotel-scoped access, assigned hotel management, accommodation request handling, and partner profile edits submitted back to tourism tenant admins for approval.
- Public hotel marketplace UI exists at `/discover/hotels`, including search, destination/type/amenity filters, local fallback hotel data, and sorting by featured, rating, or newest.
- Public hotel detail pages exist at `/discover/hotels/:slug`, including hotel information, grounded trust/fit copy, AI hotel concierge guidance, and conversion into traveler inquiry flow.
- Hotel detail conversion now supports both `direct-hotel` and `itinerary-add-on` intent modes, so travelers can ask about a hotel directly or request it inside a wider itinerary.
- Hotel inquiry context is preserved through traveler inquiry payloads using `hotelId`, `hotelName`, `hotelIntentType`, operator tenant id/slug, source channel, and campaign label.
- Hotel marketplace leads now receive hotel-specific lead scoring reasons and boosts.
- Hotel-related inquiry automation now adds operator-facing hotel lead details and action checklists for direct hotel inquiries and itinerary hotel add-ons.
- Platform UI exposes hotels from the public marketplace surface and platform demo fallbacks include hotel list/detail examples.
- Focused tests exist for hotel records, hotel routes, hotel marketplace shaping, hotel AI concierge, hotel trust helpers, hotel discovery helpers, hotel partner auth/access/routes, admin hotel manager state, API helpers, and hotel lead automation/scoring.

### Not Accomplished Yet

- No real-time hotel inventory, room availability, rate calendar, booking engine, or payment checkout for hotels.
- No channel manager integration or OTA-style live supplier connectivity.
- No hotel owner self-claim flow; hotel partner accounts are currently created by tourism tenant admins.
- No full hotel analytics dashboard for sponsored placement performance, lead conversion reporting, or hotel ranking insights.
- No restaurant marketplace implementation yet; restaurant work remains a later phase using the hotel architecture as the pattern.
- No full semantic/vector hotel retrieval layer yet; current hotel AI guidance is deterministic and grounded in known hotel fields.
- No automated browser visual verification is available in this shell because the browser CLI was unavailable and `npx` fetch failed on local certificate verification.

### Recent Hotel Commits

- `0c6529f` - Add hotel marketplace foundation
- `bfc506f` - Add hotel partner admin portal
- `6691a8e` - Add hotel partner onboarding controls
- `a8667b9` - Add hotel partner request handling
- `c6e1f1c` - Add hotel partner profile approval workflow
- `72b8b70` - Add grounded hotel AI concierge recommendations
- `23d7360` - Expose hotel marketplace in platform UI
- `1b4cbe1` - Add hotel inquiry intent selector
- `48fae76` - Add hotel discovery sorting
- `255e206` - Add hotel lead automation hints
- `3e1b743` - Boost hotel marketplace lead scoring

---

## File Structure

### New backend files

- Create: `backend/models/Hotel.js`
  - canonical Mongo hotel entity
- Create: `backend/routes/hotelRoutes.js`
  - tenant/admin CRUD and public hotel reads
- Create: `backend/utils/hotelMarketplace.js`
  - shared hotel summaries, trust labels, traveler-facing shaping
- Create: `backend/utils/postgresHotelRecords.js`
  - sync, lookup, and normalized hotel record transforms
- Create: `backend/utils/postgresFirstHotelService.js`
  - postgres-first create/update pattern matching accommodation service style
- Create: `backend/tests/hotelMarketplace.test.js`
- Create: `backend/tests/postgresHotelRecords.test.js`
- Create: `backend/tests/hotelRoutes.test.js`

### Backend files to modify

- Modify: `backend/routes/accommodationRoutes.js`
  - support `hotelId` references on reservations
- Modify: `backend/models/AccommodationReservation.js`
  - add `hotelId`
- Modify: `backend/models/PartnerAccount.js`
  - optional relationship helpers or metadata for linked hotels
- Modify: `backend/routes/customInquiryRoutes.js`
  - accept hotel inquiry / itinerary hotel context
- Modify: `backend/utils/postgresPrimaryReads.js`
  - add hotel primary-read normalization
- Modify: `backend/routes/infrastructureRoutes.js`
  - expose hotel business-truth readiness if needed
- Modify: `backend/server.js`
  - register hotel routes

### New frontend files

- Create: `src/pages/HotelDiscovery.jsx`
  - public hotel listing page
- Create: `src/pages/HotelDetail.jsx`
  - public hotel detail page
- Create: `src/components/Marketplace/hotelTrustUtils.js`
  - traveler-facing hotel trust and fit labels
- Create: `src/components/Marketplace/HotelAiConciergeCard.jsx`
  - visible traveler AI concierge surface
- Create: `src/components/Admin/HotelManager.jsx`
  - tenant-admin hotel management
- Create: `src/components/Admin/hotelManagerState.js`
  - reducer/helper logic for hotel admin flows
- Create: `src/components/Admin/hotelManagerState.test.js`
- Create: `src/pages/hotelDiscoveryUtils.js`
- Create: `src/pages/hotelDiscoveryUtils.test.js`

### Frontend files to modify

- Modify: `src/services/api.js`
  - add hotel API helpers
- Modify: `src/pages/AdminDashboard.jsx`
  - add hotel manager tab
- Modify: `src/components/Admin/AdminSidebar.jsx`
  - add hotel nav item
- Modify: `src/pages/PlatformInfoPage.jsx`
  - optional product visibility copy if needed
- Modify: `src/pages/PlanMyTrip.jsx` or `src/components/PlanMyTrip/PlanMyTripWizard.jsx`
  - carry hotel intent into itinerary path
- Modify: `src/pages/GlobalDiscovery.jsx`
  - later optional hotel cross-links or destination hooks, only if needed in this slice

### Existing references to follow

- Reference: `backend/routes/accommodationRoutes.js`
- Reference: `backend/routes/partnerPortalRoutes.js`
- Reference: `backend/utils/postgresOperationsRecords.js`
- Reference: `backend/utils/postgresFirstAccommodationService.js`
- Reference: `backend/utils/postgresPrimaryReads.js`
- Reference: `src/components/Admin/AccommodationManager.jsx`
- Reference: `src/pages/GlobalDiscovery.jsx`
- Reference: `src/pages/DiscoveryTourDetail.jsx`
- Reference: `src/components/Marketplace/marketplaceTrustUtils.js`

## Task 1: Canonical Hotel Entity And Business-Truth Record Foundation

**Files:**
- Create: `backend/models/Hotel.js`
- Create: `backend/utils/postgresHotelRecords.js`
- Create: `backend/utils/postgresFirstHotelService.js`
- Modify: `backend/utils/postgresPrimaryReads.js`
- Test: `backend/tests/postgresHotelRecords.test.js`

- [x] **Step 1: Write the failing hotel record tests**
- [x] **Step 2: Run `node --test backend/tests/postgresHotelRecords.test.js` and verify failure**
- [x] **Step 3: Implement the Mongo `Hotel` model with clear public-entity fields**
- [x] **Step 4: Implement normalized PostgreSQL hotel record builders and lookups**
- [x] **Step 5: Implement postgres-first create/update helpers following accommodation patterns**
- [x] **Step 6: Extend primary-read normalization for hotel rows**
- [x] **Step 7: Re-run `node --test backend/tests/postgresHotelRecords.test.js` and verify pass**
- [x] **Step 8: Commit the foundation changes**

## Task 2: Tenant/Admin Hotel Management And Operations Linkage

**Files:**
- Create: `backend/routes/hotelRoutes.js`
- Modify: `backend/models/AccommodationReservation.js`
- Modify: `backend/routes/accommodationRoutes.js`
- Modify: `backend/server.js`
- Create: `src/components/Admin/HotelManager.jsx`
- Create: `src/components/Admin/hotelManagerState.js`
- Test: `backend/tests/hotelRoutes.test.js`
- Test: `src/components/Admin/hotelManagerState.test.js`

- [x] **Step 1: Write the failing admin route and state tests**
- [x] **Step 2: Run `node --test backend/tests/hotelRoutes.test.js src/components/Admin/hotelManagerState.test.js` and verify failure**
- [x] **Step 3: Implement tenant/admin hotel CRUD routes**
- [x] **Step 4: Register hotel routes in the server**
- [x] **Step 5: Add `hotelId` support to accommodation reservations without breaking existing name fallbacks**
- [x] **Step 6: Build the tenant-admin hotel manager UI**
- [x] **Step 7: Add the hotel manager into admin navigation**
- [x] **Step 8: Re-run `node --test backend/tests/hotelRoutes.test.js src/components/Admin/hotelManagerState.test.js` and verify pass**
- [x] **Step 9: Commit the admin and linkage slice**

## Task 3: Public Hotel Discovery And Detail Pages

**Files:**
- Create: `backend/utils/hotelMarketplace.js`
- Create: `backend/tests/hotelMarketplace.test.js`
- Create: `src/pages/HotelDiscovery.jsx`
- Create: `src/pages/HotelDetail.jsx`
- Create: `src/pages/hotelDiscoveryUtils.js`
- Create: `src/pages/hotelDiscoveryUtils.test.js`
- Modify: `src/services/api.js`

- [x] **Step 1: Write the failing backend and frontend hotel discovery/detail helper tests**
- [x] **Step 2: Run `node --test backend/tests/hotelMarketplace.test.js src/pages/hotelDiscoveryUtils.test.js` and verify failure**
- [x] **Step 3: Implement hotel marketplace shaping helpers on the backend**
- [x] **Step 4: Add hotel API helpers in `src/services/api.js`**
- [x] **Step 5: Build the public hotel discovery page**
- [x] **Step 6: Build the public hotel detail page**
- [x] **Step 7: Wire routes into the app routing layer**
- [x] **Step 8: Re-run `node --test backend/tests/hotelMarketplace.test.js src/pages/hotelDiscoveryUtils.test.js` and verify pass**
- [x] **Step 9: Commit the public discovery slice**

## Task 4: Traveler Conversion Paths For Hotel Inquiry And Itinerary Intent

**Files:**
- Modify: `backend/routes/customInquiryRoutes.js`
- Modify: `backend/models/CustomInquiry.js` only if hotel context fields are truly missing
- Modify: `src/pages/HotelDetail.jsx`
- Modify: `src/components/PlanMyTrip/PlanMyTripWizard.jsx`
- Test: `backend/tests/hotelRoutes.test.js`
- Test: `src/pages/hotelDiscoveryUtils.test.js`

- [x] **Step 1: Add failing tests for hotel inquiry and itinerary-intent payload shaping**
- [x] **Step 2: Run targeted tests and verify failure**
- [x] **Step 3: Extend inquiry handling to preserve `hotelId` and hotel-intent attribution**
- [x] **Step 4: Add `Send Inquiry` CTA handling on hotel detail**
- [x] **Step 5: Add `Request In Itinerary` flow into plan-my-trip entry**
- [x] **Step 6: Re-run targeted tests and verify pass**
- [x] **Step 7: Commit the conversion slice**

## Task 5: Hotels V1 AI Concierge And Operator Autopilot Hooks

**Files:**
- Create: `src/components/Marketplace/HotelAiConciergeCard.jsx`
- Create: `src/components/Marketplace/hotelTrustUtils.js`
- Modify: `src/pages/HotelDetail.jsx`
- Modify: `backend/utils/chatSalesAssistant.js` or a new hospitality-specific helper only if needed
- Modify: `backend/controllers/chatController.js` only if hotel context needs to feed assistant routing
- Test: `backend/tests/chatSalesAssistant.test.js`
- Test: `src/components/Marketplace/hotelTrustUtils.test.js`

- [x] **Step 1: Write failing tests for hotel fit explanations and trust summaries**
- [x] **Step 2: Run `node --test backend/tests/chatSalesAssistant.test.js src/components/Marketplace/hotelTrustUtils.test.js` and verify failure**
- [x] **Step 3: Implement hotel trust and fit explanation helpers**
- [x] **Step 4: Build the visible hotel AI concierge card on detail pages**
- [x] **Step 5: Add minimal operator-autopilot hints for hotel-related lead qualification**
- [x] **Step 6: Re-run the targeted AI tests and verify pass**
- [x] **Step 7: Commit the AI slice**

## Task 6: Full Hotels V1 Verification And Documentation

**Files:**
- Modify: `README.md` only if feature visibility or routes need documenting
- Verify: `backend/tests/postgresHotelRecords.test.js`
- Verify: `backend/tests/hotelRoutes.test.js`
- Verify: `backend/tests/hotelMarketplace.test.js`
- Verify: `backend/tests/chatSalesAssistant.test.js`
- Verify: `src/components/Admin/hotelManagerState.test.js`
- Verify: `src/pages/hotelDiscoveryUtils.test.js`
- Verify: `src/components/Marketplace/hotelTrustUtils.test.js`

- [x] **Step 1: Run the full targeted hotel test suite**
- [x] **Step 2: Run `npm run build`**
- [x] **Step 3: Fix any regressions until tests and build pass**
- [x] **Step 4: Update docs only if a visible admin/public entry point needs mention**
- [ ] **Step 5: Commit the verification/doc cleanup**

## Verification Commands

Run these during execution as the plan reaches each slice:

```bash
node --test backend/tests/postgresHotelRecords.test.js
node --test backend/tests/hotelRoutes.test.js src/components/Admin/hotelManagerState.test.js
node --test backend/tests/hotelMarketplace.test.js src/pages/hotelDiscoveryUtils.test.js
node --test backend/tests/chatSalesAssistant.test.js src/components/Marketplace/hotelTrustUtils.test.js
npm run build
```

## Notes For The Implementer

- Reuse the platform's existing Mongo write + Postgres business-truth pattern. Do not create a hotels-only storage exception.
- Keep `Hotel` separate from `AccommodationReservation`. Reservation records reference hotels; hotels do not become reservations.
- Keep V1 focused on discovery, trust, inquiry, itinerary intent, and AI guidance. Do not drift into OTA inventory complexity.
- Carry revenue attribution hooks from day one, even if sponsored placement logic itself stays shallow in this first slice.
- Design all restaurant-facing ideas out of this plan unless they directly improve hotel architecture reuse.
