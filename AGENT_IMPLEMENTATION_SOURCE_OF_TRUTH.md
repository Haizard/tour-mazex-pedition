# Agent Implementation Source Of Truth

Last updated: 2026-05-04

## Purpose

This file is the live handoff brain for any AI agent working on this repo.

If a new agent starts in another IDE or another session, this file should be read first.

Its job is to prevent:

- losing implementation context
- repeating finished work
- confusing partial phases with unfinished phases
- drifting away from the real roadmap

This file is the runtime source of truth.

Supporting planning files still matter, but this file has priority for "where we really are now".

## Canonical Support Files

Read these after this file:

- `MASTER_IMPLEMENTATION_BLUEPRINT.md`
- `real scale project design and brainstorming structure.md`
- `real scale opportunity.md`
- `docs/superpowers/plans/2026-04-28-tourism-infrastructure-master-roadmap.md`
- `docs/superpowers/plans/2026-04-28-phase-1-revenue-core.md`
- `docs/superpowers/plans/2026-04-28-phase-2-operations-core.md`
- `docs/superpowers/plans/2026-04-28-phase-3-business-truth-migration.md`
- `docs/superpowers/plans/2026-04-28-phase-4-distribution-and-network.md`

## Repo Reality Snapshot

- Branch: `main`
- Current HEAD when this file was written: `42f1cb7`
- Workspace status before this file: only unrelated untracked `logo.png`
- Main architecture now: `React + Vite + Express + MongoDB + PostgreSQL/Supabase + Redis`
- PostgreSQL read/write migration is no longer theoretical. It is already active across major domains.

## Recent Pulled Changes Checked

Two pulled changes were checked before writing this file:

1. `42f1cb7` `Merge branch 'main' of https://github.com/Haizard/tour-mazex-pedition`
This confirms the repo already contains the large implementation wave for:
- revenue automation
- operations modules
- PostgreSQL record tables and read models
- infrastructure readiness surfaces
- distribution surfaces
- many admin managers and tests

2. `b4010f4` `bootstrap`
This removed legacy static assets and snippet files that were no longer part of the current product path.

Do not assume older screenshots, snippet HTML files, or deleted legacy asset references are still part of the target system.

## Main Truth About Current Project Status

The product is no longer in "idea" stage and no longer only in "feature prototype" stage.

It has already completed large implementation work in:

- Phase 1 revenue-core
- Phase 2 operations-core
- major parts of Phase 3 business-truth migration
- major parts of Phase 4 distribution foundation
- a newer cutover wave beyond the original plan, where admin/workflow reads and many write responses already prefer PostgreSQL

This means:

- MongoDB is still present
- MongoDB is still used in write flows
- but PostgreSQL is already active for shadow writes, first-class record tables, read models, and many primary admin/workflow responses

## Phase Status

Use the 6-phase model from `MASTER_IMPLEMENTATION_BLUEPRINT.md`.

### Phase 1. Stabilize the revenue machine

Status: `Implemented`

Confirmed implemented areas:

- payment lifecycle hardening
- webhook/idempotency improvements
- quote-booking-payment state alignment
- unified inbox revenue metadata
- sales assistant upgrades
- attribution foundations

### Phase 2. Stabilize real operations

Status: `Implemented`

Confirmed implemented areas:

- guide/driver planning
- accommodation coordination
- airport pickup coordination
- conflict-aware dashboards
- operations admin surfaces

### Phase 3. Move business truth into PostgreSQL

Status: `Mostly implemented but not fully complete`

Confirmed implemented areas:

- Supabase/PostgreSQL setup
- first-class PostgreSQL tables for major domains
- revenue, traveler, operations, partner, media, competitor, assistant, engagement, and lifecycle record sync
- PostgreSQL read models
- Redis-backed shadow write replay support
- many PostgreSQL-primary admin/workflow reads

Still unfinished inside Phase 3:

- true PostgreSQL-first write ownership for selected domains
- full reduction of Mongo-first write dependency
- cutover audit for routes still returning or depending on Mongo-only truth
- migration cleanup strategy for long-term Mongo retirement where appropriate

### Phase 4. Install supporting infrastructure

Status: `Partially implemented`

Confirmed implemented areas:

- Redis configured and reachable
- PostgreSQL reachable through Supabase pooler path
- infrastructure readiness and data-platform visibility
- object-storage abstraction layer exists

Still unfinished inside Phase 4:

- real S3/object-storage production cutover
- pgvector installation and real retrieval pipeline
- broader event/job orchestration beyond current Redis replay and support utilities

### Phase 5. Open distribution channels

Status: `Partially implemented`

Confirmed implemented areas:

- distribution bootstrap
- hosted social/distribution surfaces
- embedded planning route
- admin distribution manager

Still unfinished inside Phase 5:

- stronger widget productization
- public embed hardening
- external API product layer
- white-label delivery completion
- partner-facing distribution self-service depth

### Phase 6. Open network and intelligence layers

Status: `Not fully implemented`

There are foundations for:

- competitor intelligence
- dynamic pricing
- partner records
- language/travel assistant records

But the full ecosystem/network layer is still unfinished.

## Phase Count Summary

- Total phases in master blueprint: `6`
- Fully implemented phases: `2`
- Partially implemented phases: `3`
- Not yet fully implemented phases: `4`

Important:

- Phase 3, Phase 4, and Phase 5 are not empty. They are already advanced but still incomplete.
- Phase 6 is the least complete major phase.

## Unfinished Feature Count

To avoid fake precision, this tracker counts grouped implementation capabilities, not tiny tickets.

Current unfinished major feature groups: `18`

They are:

1. PostgreSQL-first write ownership for selected core domains
2. Route-by-route cutover audit to remove remaining Mongo-only business-truth dependencies
3. Long-term migration cleanup and rollback/cutover strategy
4. Real S3/object-storage production ownership for files and generated artifacts
5. pgvector-based retrieval memory and semantic search activation
6. Broader Redis job orchestration beyond current retry/replay support
7. Widget productization hardening for third-party embedding
8. External API product layer for non-full-site consumers
9. White-label delivery completion
10. External partner self-service workflow completion
11. Multi-channel attribution and ROI intelligence
12. Supplier ecosystem coordination network
13. Dynamic bundling / package-on-the-fly builder
14. Traveler live itinerary / post-booking experience layer
15. Trust, verification, and fraud layer
16. Demand forecasting and deeper pricing intelligence
17. Affiliate / OTA / marketplace connector layer
18. Group travel, disruption handling, and broader ecosystem operations workflows

## Current Best Understanding Of "Where To Continue"

The most correct next implementation direction is:

### Primary next target

Finish the remaining Phase 3 and Phase 4 cutover work before jumping deep into Phase 6.

That means:

1. complete PostgreSQL-first ownership on the most important workflows
2. finish S3/object-storage real ownership
3. activate pgvector retrieval infrastructure
4. expand Redis-backed orchestration where business workflows still run too much in request time

### Why this should be next

The repo already has many advanced features.

The main remaining weakness is no longer "missing admin screens".

The main weakness is:

- ownership consistency
- infrastructure completion
- execution correctness at scale

## Recommended Next Build Order

When a new agent continues, use this order unless the user explicitly redirects:

1. Audit remaining Mongo-first write paths in core workflows
2. Move the highest-value ones toward PostgreSQL-first ownership
3. Finish real object-storage ownership for media, PDFs, invoices, itineraries
4. Install real pgvector retrieval pipeline
5. Harden Redis-backed async execution for webhooks, follow-ups, notifications, and scheduled jobs
6. Only after that, continue broader distribution/network/intelligence expansion

## Working Rules For Future Agents

Any future agent should follow these rules:

1. Read this file first.
2. Treat this file as newer runtime truth than older unchecked roadmap checkboxes.
3. Do not repeat Phase 1 or Phase 2 as if they are unstarted.
4. Do not restart PostgreSQL migration from zero. It is already active.
5. Do not treat MongoDB as the permanent owner of business truth.
6. Do not push unrelated files such as stray local assets unless the user explicitly asks.
7. Before claiming a phase is complete, verify with tests, route imports, lint, and if relevant real data-path checks.

## Verification Baseline

Before closing any new implementation slice, future agents should prefer:

```bash
node --test <targeted test files>
node -e "import('./backend/routes/<route-file>.js').then(() => console.log('ok')).catch((error) => { console.error(error); process.exit(1); })"
npx eslint <changed files>
git status --short
```

If the work touches PostgreSQL ownership or read models, also verify the exact affected read/write helpers and their tests.

## Known Non-Task Item

At the time this file was created, the known unrelated local file was:

- `logo.png`

Future agents should avoid mixing unrelated local assets into implementation commits unless explicitly requested.

## Handoff Sentence For New Agents

If you are a new agent, start from this assumption:

`Revenue and operations foundations are already implemented, PostgreSQL migration is already active, cutover is partially done, and the highest-value unfinished work is completing ownership/infrastructure correctness before expanding more ecosystem features.`

