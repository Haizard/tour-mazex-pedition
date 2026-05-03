# Social Publishing Phase 1 Design

**Date:** 2026-04-22

**Goal**

Build the first revenue-focused social media feature inside the tenant admin so tour operators can generate, edit, schedule, and manage Facebook and Instagram post drafts from existing tour packages without requiring live Meta API integration in the first release.

## Scope

Phase 1 covers the CMS-side publishing center only:

- Generate social post drafts from `TourPackage` content
- Support Facebook and Instagram as target platforms
- Let tenant admins edit captions, hashtags, call-to-action text, and selected images
- Let tenant admins save drafts and schedule posts
- Show a queue of posts with statuses and basic filtering
- Store all data in an integration-ready model so real publishing can be added later without redesigning the admin workflow

Phase 1 explicitly does not include:

- OAuth account connection to Meta
- Live publishing to Facebook or Instagram
- Analytics from social platforms
- Unified inbox, messaging, or WhatsApp automation
- Blog-to-social bulk repurposing

## Product Intent

The feature should feel like a natural extension of the existing tenant CMS, not a separate tool. A tenant should be able to take an existing tour package and turn it into a campaign-ready social post in a few steps. The near-term value is speed and consistency. The longer-term value is that the stored content and queue become the foundation for true social automation in later phases.

## Architecture

The implementation will add one focused domain to the current stack:

- A backend `SocialPost` model for storing drafts, scheduled posts, and future publish metadata
- A backend controller and route set for generation, CRUD, and status transitions
- A lightweight content generation service that derives social-ready copy from `TourPackage` fields and optionally uses the existing AI tooling when available
- A tenant admin manager component for creating and managing posts

The architecture should separate post preparation from actual platform delivery. In Phase 1, the delivery layer is intentionally absent, but the model should preserve enough structure to connect a real publisher later.

## Data Model

Add a `SocialPost` collection scoped by tenant.

Suggested fields:

- `tenantId`: tenant ownership
- `tourPackageId`: source package reference
- `title`: internal admin title for the post
- `platforms`: array of `instagram` and/or `facebook`
- `status`: one of `draft`, `scheduled`, `ready`, `published`, `failed`
- `caption`: main editable caption text
- `hashtags`: array of strings
- `callToAction`: short CTA text
- `imageIds`: selected media identifiers or URLs
- `scheduledFor`: optional datetime
- `generationSource`: `tour-package` for now
- `generationMeta`: optional object containing fallback or AI generation metadata
- `publishResult`: reserved object for later platform response storage
- `lastError`: reserved string for later publish errors
- `createdBy`: admin identifier if available in existing auth context
- timestamps

Model constraints:

- `status` defaults to `draft`
- `platforms` must contain at least one supported platform
- `scheduledFor` is required when status is `scheduled`
- `imageIds` may be empty during draft generation, but scheduling should require at least one image

## Backend Design

### Endpoints

Add tenant-admin-protected endpoints for:

- Generate social suggestions from a tour package
- Create a social post draft
- List social posts for the current tenant
- Update a social post
- Delete a social post draft or scheduled item
- Change status between `draft`, `ready`, and `scheduled`

Recommended API shape:

- `POST /api/admin/social-posts/generate`
- `POST /api/admin/social-posts`
- `GET /api/admin/social-posts`
- `PATCH /api/admin/social-posts/:id`
- `DELETE /api/admin/social-posts/:id`

### Generation Strategy

The generator should be resilient and never block the workflow if AI fails.

Generation order:

1. Load the selected `TourPackage`
2. Build a deterministic fallback caption from package title, highlights, duration, location, and booking intent
3. If existing AI generation utilities are already configured and stable, request improved caption variants and hashtag suggestions
4. Return a response containing:
   - one recommended caption
   - optional alternative captions
   - suggested hashtags
   - suggested CTA
   - recommended image candidates

If AI fails or times out, return the deterministic result plus metadata showing the fallback was used.

### Validation and Errors

Validation rules should be explicit:

- Reject unknown platforms
- Reject scheduling in the past
- Reject scheduling without at least one selected image
- Reject creation when the source tour package does not exist for the tenant

Error responses should be tenant-safe and admin-friendly, with short actionable messages suitable for display in the dashboard.

## Frontend Design

### Admin Navigation

Add a new sidebar item in the tenant admin for social publishing. The label should be short and clear, such as `Social Posts`.

### Admin Manager

Create a manager view consistent with existing admin tools. The view should support:

- A list of existing social posts with filters by status
- A create flow starting from available tour packages
- An editor panel or modal for:
  - platform selection
  - caption editing
  - hashtag editing
  - CTA editing
  - image selection
  - scheduling datetime
- Status badges and lightweight queue management

### Create Flow

Recommended flow:

1. Admin clicks `Create Post`
2. Admin selects a tour package
3. Frontend calls generation endpoint
4. Admin reviews generated content
5. Admin edits content as needed
6. Admin saves as draft or schedules the post

This flow should also support opening an existing draft for further editing.

### UX Notes

- Keep the interface practical and editorial rather than flashy
- Show generation status clearly while suggestions load
- If no tour image is available, warn the user early
- Make fallback generation feel acceptable, not broken

## Data Flow

1. Tenant admin loads the social posts manager
2. Frontend fetches tenant-scoped social posts and available tour packages
3. When a package is chosen, frontend requests generation suggestions from the backend
4. Backend builds deterministic content and optionally AI-enhanced variants
5. Frontend populates the editor with returned values
6. Admin saves or schedules the post
7. Backend validates and persists the post with the selected status
8. Queue refreshes and displays the saved item

## Future Integration Readiness

Phase 1 must leave clear seams for Meta integration:

- `platforms` is already normalized for delivery routing
- `publishResult` can store platform-specific responses later
- `lastError` supports failed delivery states
- `status` includes `published` and `failed` even if Phase 1 won’t actively use them yet

This allows a future background publishing service to consume scheduled posts without changing the admin experience or stored content shape.

## Testing Strategy

Backend:

- Model validation for status/platform/scheduling rules
- Controller tests for generate, create, list, update, and delete
- Fallback generation test when AI path is unavailable
- Tenant isolation checks so admins only access their own posts

Frontend:

- Manual validation of create, edit, draft save, and schedule flows
- Manual validation of error states such as missing images or past dates
- Basic rendering checks for filters, statuses, and loading states

## Risks and Guardrails

Primary risks:

- Scope creep into live publishing or inbox work
- Over-coupling the feature to AI generation
- Weak validation around scheduling and media selection

Guardrails:

- Keep the release centered on content preparation and queue management
- Always provide deterministic fallback content
- Prefer one focused manager over multiple overlapping admin screens

## Success Criteria

Phase 1 is successful when a tenant admin can:

- Select a tour package inside the existing admin
- Generate a usable Facebook/Instagram post draft
- Edit caption, hashtags, CTA, and image selection
- Save the result as a draft or scheduled post
- Reopen and manage the queue later

No external social account connection is required for Phase 1 success.
