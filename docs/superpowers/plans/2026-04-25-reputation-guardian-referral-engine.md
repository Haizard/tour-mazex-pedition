# Reputation Guardian & Referral Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an autonomous reputation management system that filters traveler feedback via WhatsApp, redirects happy customers to public review platforms, captures private feedback from unsatisfied travelers, and manages a referral reward loop.

**Architecture:**
- **Model:** `TravelerFeedback` stores ratings, private feedback, a secure `publicToken`, and unique `referralCode`.
- **Trigger:** Update `Booking` status to include `Completed`. When a booking is marked `Completed`, a WhatsApp review sequence is automatically scheduled.
- **Public View:** `/feedback/:token` provides a premium rating interface (1-5 stars).
- **Filtering Logic:** 
    - Rating 4-5: Display Google/TripAdvisor links + Generate Referral Code.
    - Rating 1-3: Display Private Feedback form.
- **WhatsApp Integration:** Delivery via `metaGraphApi` using the automated sequencing engine.

**Tech Stack:** React 18, Node.js, Mongoose, Meta Graph API, Tailwind CSS

---

## File Structure

**Create:**
- `backend/models/TravelerFeedback.js`
- `src/pages/FeedbackPublicView.jsx`

**Modify:**
- `backend/models/Booking.js`
- `backend/controllers/bookingController.js`
- `backend/routes/bookingRoutes.js`
- `backend/utils/followUpSequencing.js`
- `backend/scripts/processFollowUps.js`
- `src/AppRoutes.jsx`
- `src/services/api.js`

---

## Task 1: Extend Booking Model and Create Feedback Model

**Files:**
- Modify: `backend/models/Booking.js`
- Create: `backend/models/TravelerFeedback.js`

- [x] **Step 1: Update Booking status enum**
    Add `Completed` to the status enum.

- [x] **Step 2: Create TravelerFeedback.js**
    Fields: `tenantId`, `bookingId`, `rating`, `privateNote`, `publicToken` (unique), `referralCode` (unique), `status` ('pending', 'submitted').

- [x] **Step 3: Run sanity verification**
    Run: `node -e "import('./backend/models/TravelerFeedback.js').then(() => console.log('model-ok'))"`
    Expected: `model-ok`

---

## Task 2: Implement Feedback Public View (The Guardian)

**Files:**
- Create: `src/pages/FeedbackPublicView.jsx`
- Modify: `src/AppRoutes.jsx`

- [ ] **Step 1: Build FeedbackPublicView.jsx**
    - Star rating selector (1-5).
    - Dynamic conditional rendering:
        - If rating < 4: Show private feedback text area + submit.
        - If rating >= 4: Show Google/TripAdvisor buttons + "Refer a Friend" code.
    - Submit logic to update `TravelerFeedback` in backend.

- [ ] **Step 2: Register route**
    `path="feedback/:token"` in `AppRoutes.jsx`.

---

## Task 3: Automatic Triggering & WhatsApp Sequencing

**Files:**
- Modify: `backend/controllers/bookingController.js`
- Modify: `backend/utils/followUpSequencing.js`

- [x] **Step 1: Hook into status change**
    In `updateBookingStatus`, if status transitions to `Completed`:
    - Create `TravelerFeedback` entry with a unique token.
    - Schedule a WhatsApp touchpoint via `LeadFollowUpSequence` (or a dedicated review sequence).

- [x] **Step 2: Update generator in followUpSequencing.js**
    Add `generateReviewRequest(booking, feedbackToken)` that builds the initial WhatsApp nudge.

---

## Task 4: Admin Dashboard & Roadmap Update

**Files:**
- Modify: `src/components/Admin/BookingManager.jsx` (or equivalent)
- Modify: `FEATURE_PROGRESS_TRACKER.md`

- [x] **Step 1: Show Feedback in Admin**
    Add a "Feedback" indicator to completed bookings.

- [x] **Step 2: Update Roadmap**
    Mark "Review Automation" as `Complete`.
