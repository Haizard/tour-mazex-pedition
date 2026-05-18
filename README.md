# Maz Expeditions Platform

Multi-tenant tourism platform for tour operators, combining website CMS, bookings, inquiries, marketplace discovery, traveler engagement, and lightweight growth automation in one system.

## Current Focus

- Strengthen tenant operations for the public marketplace
- Keep social and messaging automation lightweight enough for small operators
- Improve traveler trust signals, availability confidence, and lead conversion

## Core Product Areas

### Tenant Website + CMS
- Tour package management
- Blogs, FAQ, gallery, menus, and homepage content
- Site settings, branding, and public contact channels

### Booking + Lead Operations
- Booking requests and traveler inquiries
- Lead inbox and unified inbox workflows
- Quotes, follow-ups, repeat customer campaigns, and payment coordination

### Marketplace
- Public discover page with filtering, region map, saved trips, and comparisons
- Marketplace package detail pages with reviews, traveler photos, Q&A, and availability
- Tenant controls for discover visibility, partner distribution, moderation, and community rules
- Reminder flow for saved trips and future departure tracking

### Growth Automation
- Social account connections for Meta and WhatsApp
- Social post planning and publishing flows
- Email audience bucket and campaign foundations
- Content repurposing and operator marketing workflows

## Feature Tracking

### Marketplace Completed
- Discover page redesign with stronger filtering and layout
- Package-level marketplace visibility controls
- Traveler reviews, shared travel moments, and public package questions
- Tenant moderation queues and community publishing rules
- Saved trips, comparison sets, and map-first discovery
- Marketplace availability management and departure signaling
- Reminder capture for saved trips
- Tenant marketplace operations snapshot in admin

### Marketplace Next
- Browser QA and mobile refinement across marketplace surfaces
- More advanced operator-side availability workflows
- Stronger conversion analytics around saved trips, reminders, and inquiries
- Richer community and trust presentation where real traveler content grows
- Template marketplace for ready-to-use tourism website UI, connected to the page builder with purchased-template status and tenant-specific personalization before use

### Tenant Routing Hardening Completed
- Central tenant path scoping for shared nav, footer, hero, and CTA components
- Tenant blog detail and category navigation regression coverage
- Demo-tenant path safety so already-scoped `/demo/...` links are preserved
- Public-page auth session checks no longer spam admin session requests

### Social Automation Completed
- Facebook and Instagram publishing support through Meta connections
- WhatsApp Business connection and outbound lead messaging foundations
- Social post readiness feedback and provider-specific validation states

### Social Automation Approved Roadmap
These were intentionally selected because they are lighter-weight and better suited to platform-driven automation from existing package, blog, review, image, and availability data.

- Telegram
- Google Business Profile
- Pinterest

### Social Automation Deferred
These are intentionally not in the near-term rollout because they either depend heavily on video workflows or less lightweight access patterns.

- TikTok
- YouTube
- X
- LinkedIn

## Tenant Admin Highlights

- `Packages`: inventory, marketplace controls, and availability settings
- `Distribution`: marketplace operations, visibility, and moderation
- `Inbox And Sales`: lead inbox, unified inbox, and email integrations
- `Social Accounts`: public WhatsApp number, Meta setup, WhatsApp Business setup
- `Campaigns`: audience-backed tenant marketing workflows

## Development Notes

- Frontend: React + Vite
- Backend: Express
- Multi-tenant routing supports both demo paths and custom domains
- Marketplace and growth features are being tracked in-repo as production work, not demo-only experiments

## Verification

Common commands:

```bash
npm run build
node --test backend/tests/marketplaceEngagementApi.test.js
```

## Tenant Mode QA Checklist

Run this whenever tenant-facing navigation, page-builder CTAs, or route helpers change:

- Open a demo tenant homepage like `/demo/<tenant>`
- Click `Blog`, open a blog detail page, and return to the blog list
- Click `Packages`, open a package detail page, and return to the package list
- Click `Contact`, `Plan My Trip`, `Gallery`, and `Destinations`
- Check desktop navbar links and mobile menu links
- Check footer links and homepage CTA buttons
- Confirm the browser stays inside the tenant path instead of jumping to platform root
- Confirm public tenant pages do not spam `/api/auth/me` or `/api/platform-auth/me`
