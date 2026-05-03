# WhatsApp Automation Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform basic WhatsApp messaging into a fully automated sales assistant with template support, automated follow-up sequences, and AI-driven conversational orchestration.

**Architecture:**
- **Templates:** Add a `WhatsAppTemplate` model to store pre-approved Meta templates and custom draft templates.
- **Sequencing:** Wire the `LeadFollowUpSequence` engine to the `metaGraphApi` to send WhatsApp touchpoints automatically.
- **Conversational Orchestration:** Implement an "AI Suggest" utility that generates context-aware WhatsApp replies based on lead data and previous chat history.
- **UI:** Enhance the `UnifiedInboxManager` with a template picker and AI reply drafting.

**Tech Stack:** React 18, Node.js, Mongoose, Meta Graph API

---

## File Structure

**Create:**
- `backend/models/WhatsAppTemplate.js`
- `backend/utils/whatsappAutomation.js`

**Modify:**
- `backend/server.js`
- `backend/utils/metaGraphApi.js`
- `src/services/api.js`
- `src/components/Admin/UnifiedInboxManager.jsx`

---

## Task 1: WhatsApp Template Support

**Files:**
- Create: `backend/models/WhatsAppTemplate.js`
- Modify: `backend/utils/metaGraphApi.js`

- [x] **Step 1: Create WhatsAppTemplate.js model**
    Fields: `tenantId`, `name`, `category`, `language`, `components` (header, body, footer, buttons), `status`.

- [x] **Step 2: Update metaGraphApi.js to support templates**
    Add `sendWhatsAppTemplateMessage(account, { phone, templateName, components })`.

- [x] **Step 3: Run sanity verification**
    Run: `node -e "import('./backend/utils/metaGraphApi.js').then(m => console.log(typeof m.sendWhatsAppTemplateMessage === 'function'))"`
    Expected: `true`

---

## Task 2: Automated WhatsApp Sequences

**Files:**
- Modify: `backend/utils/followUpSequencing.js`
- Create: `backend/scripts/processFollowUps.js` (simulated cron)

- [x] **Step 1: Update followUpSequencing.js**
    Refine the generator to use WhatsApp templates if available, or well-formatted text messages.

- [x] **Step 2: Implement processFollowUps.js**
    A script that finds `pending` touchpoints due now, sends them via `sendWhatsAppTextMessage`, and marks them `sent`.

- [x] **Step 3: Run sanity verification**
    Run: `node -e "import('./backend/models/LeadFollowUpSequence.js').then(() => console.log('model-ready'))"`
    Expected: `model-ready`

---

## Task 3: Unified Inbox UI Enhancements

**Files:**
- Modify: `src/components/Admin/UnifiedInboxManager.jsx`

- [x] **Step 1: Add Template Picker**
    Allow admins to select from saved WhatsApp templates when drafting a message.

- [x] **Step 2: Add AI Suggest Button**
    Implement a button that calls a new `POST /api/chat/suggest-whatsapp-reply` endpoint (utilizing existing lead context).

- [x] **Step 3: Verify build**
    Run: `npm run build`
    Expected: Success.

---

## Task 4: Final Roadmap Update

- [x] **Step 1: Update FEATURE_PROGRESS_TRACKER.md**
    Mark "WhatsApp Automation" as `Complete`.
