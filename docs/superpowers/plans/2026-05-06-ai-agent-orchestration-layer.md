# AI Agent Orchestration Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one central AI coordination layer that routes social, chat, email, and lead events to specialized agent decisions without creating disconnected bots.

**Architecture:** Build a pure backend orchestrator utility that classifies channel events, scores intent, chooses the responsible sub-agent, and returns consistent actions for the unified inbox and follow-up workflows. Integrate it first as inbox enrichment so existing flows gain coordinated decisions without breaking current persistence.

**Tech Stack:** Node ESM utilities, existing lead scoring helpers, unified inbox normalizers, Node test runner.

---

### Task 1: Orchestrator Contract

**Files:**
- Create: `backend/utils/aiAgentOrchestrator.js`
- Test: `backend/tests/aiAgentOrchestrator.test.js`

- [ ] Write tests for routing social price intent to the messaging sales agent.
- [ ] Write tests for routing cold leads to email nurture.
- [ ] Write tests for priority escalation on hot WhatsApp/website-chat leads.
- [ ] Implement deterministic agent decisions with shared tone, pricing guardrails, lead temperature, and next actions.

### Task 2: Unified Inbox Enrichment

**Files:**
- Modify: `backend/utils/unifiedInbox.js`
- Test: `backend/tests/unifiedInbox.test.js`

- [ ] Add orchestration decisions to every normalized inbox item.
- [ ] Preserve the existing inbox response shape while adding `agentDecision`.
- [ ] Verify sorting and legacy fields still work.

### Task 3: Documentation And Verification

**Files:**
- Modify: `AGENT_IMPLEMENTATION_SOURCE_OF_TRUTH.md`

- [ ] Record the new orchestration layer and its current MVP scope.
- [ ] Run targeted tests, route imports if needed, lint, then build.

