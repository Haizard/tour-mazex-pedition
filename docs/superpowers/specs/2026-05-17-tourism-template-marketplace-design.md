# Tourism Template Marketplace Design

## Goal

Add a template marketplace layer for tourism website UI that lets platform admins and clients browse ready-to-use page-builder templates, see which templates are already purchased, and apply a purchased template with automatic client-specific tweaks so tenant sites do not look identical.

## First Implementation Slice

The first slice is intentionally product-ready but lightweight:

- A curated registry of tourism web UI templates stored in code.
- Each template maps directly to page-builder page configs and sections.
- Templates expose preview metadata, ideal use cases, price labels, and purchase state.
- Purchased templates can be applied to a page builder draft.
- Applying a template runs a deterministic personalization pass that changes copy, CTA language, accent colors, and template metadata for the selected tenant/client.
- Non-purchased templates are visible but disabled from direct use, ready for a future checkout flow.

## User Experience

The page builder gets a new `Templates` tool beside settings, sections, AI variants, and imports.

The templates tool shows:

- template name, category, page type, and preview description
- readiness state: `Purchased`, `Available`, or `Included`
- what the template is best for
- a clear action to use the template when allowed
- a disabled purchase-ready action when not owned yet

The public app also gets a template marketplace page so clients can inspect available tourism website templates outside the admin workflow.

## Data Model

For this slice, templates are static page-builder-compatible objects in `src/pageBuilder/templateMarketplace.js`.

Each template includes:

- `id`
- `name`
- `category`
- `pageType`
- `priceLabel`
- `purchaseStatus`
- `preview`
- `bestFor`
- `sections`
- `seo`

The static model keeps the implementation independent from billing while giving the UI and page builder a stable integration point. A later phase can replace or enrich purchase state from backend tenant entitlements.

## Personalization Rules

When a purchased or included template is applied:

- section order is normalized
- hero and CTA text are adapted with the client name
- accent colors are rotated from a small curated palette
- metadata is attached to the page config to record the source template and personalization note

This makes the template usable immediately while signaling that final edits can continue in the normal page-builder controls.

## Testing

Add unit tests for the template registry and personalization helper:

- the catalog returns tourism templates with page-builder-compatible sections
- purchased templates are usable
- unavailable templates are blocked from apply
- personalized templates preserve section validity and add client-specific differences

## Future Phases

- Persist purchased templates per tenant in backend models.
- Add real checkout/fulfillment hooks.
- Add image thumbnails and live preview rendering.
- Add platform-admin template publishing controls.
- Add AI-assisted deeper redesign after applying a base template.
