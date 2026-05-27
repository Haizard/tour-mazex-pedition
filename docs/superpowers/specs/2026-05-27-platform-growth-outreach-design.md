# Platform Growth Outreach Design

## Purpose

Build a platform-admin owned growth outreach system for marketing the Mazex platform to tour companies. The system imports cold prospects from public sources, generates platform-branded email and WhatsApp outreach with an LLM, sends live messages through configured platform providers, auto-responds to qualified replies, and schedules platform social posts.

This is separate from tenant marketing. Tenant social posts, tenant email integrations, and tenant campaigns remain tenant-scoped. This feature belongs to platform admins and represents the platform brand only.

## Product Goals

- Let platform admins import tour-company prospects with public-source attribution.
- Generate email, WhatsApp, and social marketing content from platform value propositions.
- Send live outbound email and WhatsApp messages once provider readiness and compliance checks pass.
- Auto-reply to prospect questions about platform sales, onboarding, features, and configured pricing ranges.
- Schedule platform-owned Facebook and Instagram posts through platform Meta credentials.
- Maintain opt-out records, delivery status, rate limits, audit logs, and escalation trails.

## Non-Goals

- Do not impersonate tenant tour operators.
- Do not let tenant admins access platform outreach prospects.
- Do not send WhatsApp marketing to contacts without opt-in evidence or an allowed approved-message path.
- Do not let the AI negotiate custom discounts, legal terms, guarantees, refunds, or partnership terms.
- Do not build a generic mass-mailing tool without source tracking and suppression handling.

## Users And Permissions

Only authenticated platform admins can use this feature. Platform outreach routes must use the existing platform-admin authentication middleware and must not accept tenant-admin tokens.

The platform admin can:

- import and manage prospects
- configure campaigns
- connect platform delivery accounts
- generate and launch outreach
- review delivery logs and replies
- configure social schedules
- view escalations

## Data Model

### PlatformOutreachProspect

Stores a company/contact record for outreach.

Important fields:

- companyName
- contactName
- email
- whatsappNumber
- website
- country
- sourceUrl
- sourceType
- tags
- status: `new`, `queued`, `contacted`, `replied`, `qualified`, `unqualified`, `opted_out`, `blocked`
- emailOptOut
- whatsappOptInStatus: `unknown`, `opted_in`, `not_opted_in`, `opted_out`
- whatsappOptInSource
- lastContactedAt
- lastReplyAt
- metadata

Email and WhatsApp numbers should be normalized. Duplicate detection should use normalized email, normalized WhatsApp number, and website where available.

### PlatformOutreachCampaign

Stores a platform-branded campaign.

Important fields:

- title
- objective
- audienceFilters
- channels: `email`, `whatsapp`, `facebook`, `instagram`
- tone
- offer
- status: `draft`, `scheduled`, `active`, `paused`, `completed`
- schedule
- followUpCadence
- complianceProfile
- createdBy

### PlatformOutreachMessage

Stores a generated outbound or inbound message.

Important fields:

- campaignId
- prospectId
- channel
- direction: `outbound`, `inbound`
- subject
- body
- llmGenerationMeta
- status: `draft`, `queued`, `sent`, `delivered`, `failed`, `replied`, `opted_out`, `escalated`
- providerMessageId
- providerError
- scheduledFor
- sentAt
- deliveredAt

### PlatformOutreachThread

Stores the conversation history for a prospect and channel.

Important fields:

- prospectId
- campaignId
- channel
- participantAddress
- status: `open`, `qualified`, `needs_review`, `closed`, `opted_out`
- lastMessageAt
- messages
- agentState

### PlatformSocialPost

Stores platform-owned social posts. This should not reuse tenant `SocialPost` unless the existing model is deliberately generalized with an owner scope.

Important fields:

- title
- platforms
- caption
- hashtags
- imageUrls
- status: `draft`, `scheduled`, `published`, `failed`
- scheduledFor
- publishResult
- lastError
- createdBy

### PlatformOutreachEventLog

Append-only audit log for important actions.

Events include:

- prospect import
- duplicate/suppression decision
- LLM generation
- campaign launch
- provider readiness check
- send attempt
- delivery failure
- reply classification
- auto-reply sent
- escalation
- opt-out

## Provider Readiness

The feature sends live messages, not simulated messages. However, a campaign cannot launch unless the relevant provider passes readiness checks.

Email readiness requires:

- configured platform sender
- provider API key or SMTP credentials
- verified sender domain or sender identity where the provider requires it
- configured unsubscribe endpoint
- configured sender name and physical postal address for commercial email

WhatsApp readiness requires:

- Meta access token
- WhatsApp Business Account ID
- phone number ID
- approved message templates for business-initiated outreach
- configured webhook verification token and callback URL
- opt-in evidence for each contact or an explicitly supported approved-message acquisition path

Social readiness requires:

- platform Meta account connection
- Facebook Page ID for Facebook publishing
- Instagram Business Account ID for Instagram publishing
- valid publish permissions

Readiness failures block launch and create event-log entries.

## Compliance And Safety

Cold email must include sender identity, a valid postal address, and an unsubscribe mechanism. The system should suppress future outreach when a recipient unsubscribes.

WhatsApp cold marketing is more restrictive than email. The system must store opt-in status and should block business-initiated WhatsApp marketing unless the prospect is marked as opted in or the send uses an approved Meta template path that the configured provider allows. STOP and unsubscribe language must update the prospect to opted out.

The LLM must follow these guardrails:

- represent only the platform brand
- do not invent prices, guarantees, partnerships, rankings, or client results
- use configured pricing ranges only
- avoid pressure language and deceptive claims
- include opt-out language where appropriate
- escalate sensitive or uncertain conversations

## LLM Content Engine

The content engine generates:

- first-touch email
- first-touch WhatsApp template variables or approved-template copy
- follow-up email and WhatsApp messages
- social captions and hashtags
- autonomous replies to inbound prospect messages

Inputs:

- campaign objective
- platform value propositions
- configured pricing plan summaries
- prospect company profile
- source context
- previous messages
- compliance profile

Outputs must include:

- generated content
- model/source metadata
- confidence score
- intent classification
- guardrail decision
- escalation reason when applicable

If no production LLM credentials are available, generation should fail clearly instead of silently falling back to fake outreach.

## Autonomous Reply Agent

The reply agent can auto-answer:

- what the platform does
- website/CMS/page-builder questions
- AI chatbot and lead automation questions
- WhatsApp and email marketing feature questions
- social posting feature questions
- configured pricing ranges
- onboarding and demo-booking questions

The reply agent must escalate:

- custom discount negotiation
- legal, privacy, or data-processing questions
- complaints, abuse reports, or spam accusations
- unsubscribe ambiguity
- partnership, commission, or revenue-share terms
- requests for guarantees
- low-confidence classifications

Every auto-reply creates a `PlatformOutreachEventLog` record containing classification, decision, generated response metadata, and provider result.

## Queues And Scheduling

Outbound email, WhatsApp, and social posting should use queue-backed processing. If Redis is available, follow the existing queue pattern used by scheduled social posts and email sync. If Redis is unavailable, the live sender should fail safely rather than sending an uncontrolled inline blast.

Queue workers should:

- fetch due messages/posts
- re-check prospect suppression and provider readiness
- send through the provider adapter
- update delivery status
- log success/failure
- retry transient failures within configured limits
- stop on opt-out, provider policy errors, or low-quality/rate-limit warnings

## Platform Admin UI

Add a new primary platform-admin area named `Growth Outreach`.

Suggested tabs:

- Overview: campaign stats, provider readiness, recent replies, escalations
- Prospects: import, search, filters, tags, suppression status
- Campaigns: create campaign, choose channels, generate content, schedule launch
- Messages: queue, delivery status, failures, replies
- Social: platform social post editor and schedule
- Settings: provider credentials/readiness, compliance identity, rate limits, escalation rules

The UI should use the existing platform-admin visual language: dense operational panels, restrained styling, and clear status badges.

## API Surface

Routes should live under `/api/platform-admin/outreach`.

Suggested endpoints:

- `GET /prospects`
- `POST /prospects`
- `POST /prospects/import`
- `PATCH /prospects/:id`
- `GET /campaigns`
- `POST /campaigns`
- `POST /campaigns/:id/generate`
- `POST /campaigns/:id/launch`
- `POST /campaigns/:id/pause`
- `GET /messages`
- `POST /messages/:id/send-now`
- `GET /threads`
- `POST /threads/:id/agent-reply`
- `GET /social-posts`
- `POST /social-posts`
- `PATCH /social-posts/:id`
- `POST /social-posts/:id/publish-now`
- `GET /settings/readiness`

Provider credentials should be stored server-side and never returned raw to the frontend.

## Error Handling

The system should show clear operational errors:

- provider not configured
- sender not verified
- WhatsApp template missing
- prospect opted out
- WhatsApp opt-in missing
- rate limit exceeded
- LLM unavailable
- generated content failed guardrails
- provider rejected message

Failures should not delete generated content. They should keep the message visible with actionable status and event-log history.

## Testing

Backend tests:

- prospect import normalization and duplicate detection
- suppression and opt-out behavior
- campaign creation and platform-admin permission checks
- LLM guardrail classification
- provider readiness checks
- email adapter mocked sends
- WhatsApp adapter mocked sends
- social adapter mocked publishes
- queue retry and failure behavior
- autonomous reply escalation rules

Frontend tests:

- platform-admin navigation exposes Growth Outreach
- prospects import and filtering
- campaign creation and launch readiness messages
- message queue status rendering
- social post schedule form
- settings readiness display

## Rollout Plan

1. Add data models, provider readiness utilities, and platform-admin routes.
2. Build Prospect CRM and campaign creation, with launch blocked until provider readiness passes.
3. Add LLM generation and guardrail decisions.
4. Add live email provider adapter and queue worker.
5. Add live WhatsApp provider adapter and webhook/reply handling.
6. Add autonomous reply agent with escalation.
7. Add platform social scheduler.
8. Add platform-admin UI tabs and operational dashboards.

Each step should include route tests and mocked provider tests before live credentials are used.
