# Automated Follow-Up System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a multi-touch automated follow-up engine that helps convert inquiries by scheduling and tracking 1-day, 3-day, and 7-day touchpoints.

**Architecture:**
- **Model:** `LeadFollowUpSequence` stores scheduled touchpoints, their status, and the generated message content.
- **Utility:** `followUpSequencing.js` handles the logic of generating different "nudges" (e.g., "Checking in," "New availability," "Final call").
- **API:** New routes to start/pause sequences and a maintenance endpoint to simulate background processing.
- **Frontend:** Integrated controls in the `LeadInboxManager` to activate sequences and track progress.

**Tech Stack:** React 18, Node.js, Mongoose, Tailwind CSS

---

## File Structure

**Create:**
- `backend/models/LeadFollowUpSequence.js`
- `backend/utils/followUpSequencing.js`
- `backend/routes/followUpRoutes.js`

**Modify:**
- `backend/server.js`
- `backend/routes/customInquiryRoutes.js`
- `src/services/api.js`
- `src/components/Admin/LeadInboxManager.jsx`

---

## Task 1: Add the LeadFollowUpSequence model and basic utility

**Files:**
- Create: `backend/models/LeadFollowUpSequence.js`
- Create: `backend/utils/followUpSequencing.js`

- [x] **Step 1: Verify the gap exists**
    Run: `dir backend\models\LeadFollowUpSequence.js`
    Expected: File not found.

- [x] **Step 2: Write minimal implementation for LeadFollowUpSequence.js**
    Schema should include:
    - `tenantId` (ObjectId, ref: 'Tenant')
    - `inquiryId` (ObjectId, ref: 'CustomInquiry')
    - `status` (Enum: 'active', 'paused', 'completed', 'cancelled')
    - `touchpoints` (Array of: { scheduledAt: Date, channel: Enum, content: String, status: Enum['pending', 'sent', 'failed'] })

- [x] **Step 3: Implement basic sequence generator in followUpSequencing.js**
    Function `generateFollowUpSequence(inquiry)` that returns 3 touchpoints (1, 3, 7 days from now) with template-based messages.

- [x] **Step 4: Run sanity verification**
    Run: `node -e "import('./backend/utils/followUpSequencing.js').then(m => console.log(m.generateFollowUpSequence({firstName: 'Test'}).length === 3))"`
    Expected: `true`

---

## Task 2: Implement Follow-Up API and Server Wiring

**Files:**
- Create: `backend/routes/followUpRoutes.js`
- Modify: `backend/server.js`

- [x] **Step 1: Create followUpRoutes.js**
    - `POST /api/follow-ups/start/:inquiryId`: Initializes and saves a sequence.
    - `GET /api/follow-ups/inquiry/:inquiryId`: Fetches active sequence for an inquiry.
    - `PATCH /api/follow-ups/:id/status`: Updates sequence status.

- [x] **Step 2: Wire to server.js**
    `app.use('/api/follow-ups', followUpRoutes);`

- [x] **Step 3: Run sanity verification**
    Run: `node -e "import('./backend/routes/followUpRoutes.js').then(() => console.log('routes-ok'))"`
    Expected: `routes-ok`

---

## Task 3: Integrate into Lead Inbox UI

**Files:**
- Modify: `src/services/api.js`
- Modify: `src/components/Admin/LeadInboxManager.jsx`

- [x] **Step 1: Add API helpers to api.js**
    - `startFollowUpSequence(inquiryId)`
    - `fetchInquiryFollowUp(inquiryId)`
    - `updateFollowUpStatus(id, status)`

- [x] **Step 2: Update LeadInboxManager.jsx**
    - Add a "Start Auto Follow-Up" button to lead cards.
    - Show a mini-timeline of scheduled touchpoints if a sequence is active.
    - Allow pausing/cancelling from the UI.

- [x] **Step 3: Verify build**
    Run: `npm run build`
    Expected: Success.

---

## Task 4: Final verification and roadmap update

- [x] **Step 1: Smoke test the flow**
    Manually create a lead -> Start sequence -> Verify database entries.

- [x] **Step 2: Update FEATURE_PROGRESS_TRACKER.md**
    Mark "Automated Follow-Up System" as `Complete` and update comments.
