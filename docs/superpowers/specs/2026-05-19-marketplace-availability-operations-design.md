# Marketplace Availability Operations Design

Date: 2026-05-19
Repo: `C:\Users\SFG DESIGN\Desktop\tour-mazex-pedition`
Status: Draft for review

## Goal

Add a dedicated tenant-admin `Marketplace Availability` workspace that separates day-to-day departure operations from the existing package editor.

This feature should help operators:

- manage upcoming departures across many tours from one screen
- support both guaranteed departures and request-only dates
- keep published marketplace availability current and trustworthy
- improve saved-trip reminders, inquiry quality, and instant-booking confidence

## Product Decision

Use a `hybrid operations workspace`.

Role split:

- `Packages` remains the setup surface
  - configure availability defaults
  - define weekly generation rules
  - set instant-booking defaults
  - add initial departure dates
- `Marketplace Availability` becomes the daily control surface
  - manage all active departures across tours
  - update status, seats, notes, and publish confidence quickly
  - review readiness and health issues
  - handle cross-tour operations without opening each package editor

This follows the strongest marketplace pattern for operator-facing availability management while preserving the current package configuration flow.

## Scope

### In scope

- new tenant-admin `Marketplace Availability` screen
- cross-tour departures operations table
- per-tour schedule drawer
- filter and search controls
- quick row editing
- availability health warnings
- bulk selection and bulk status changes
- bulk seat adjustments
- reuse of existing embedded `marketplaceAvailability` and `marketplaceAvailabilitySettings`

### Out of scope

- extracting availability into a separate collection
- fully automated external inventory sync
- traveler-facing redesign beyond using cleaner data
- operator performance analytics for this phase
- multi-operator approval workflows

## Existing Foundation In Repo

The repo already contains the core hybrid availability model:

- [backend/models/TourPackage.js](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/backend/models/TourPackage.js)
  - `marketplaceAvailability`
  - `marketplaceAvailabilitySettings`
  - statuses:
    - `available`
    - `limited`
    - `unavailable`
    - `on-request`
- [backend/utils/marketplaceAvailability.js](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/backend/utils/marketplaceAvailability.js)
  - merges manual and generated dates
  - computes bookable and instant-bookable states
  - derives request-only summaries
- [src/pages/AdminDashboard.jsx](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/src/pages/AdminDashboard.jsx)
  - already exposes package-level setup controls
- [src/components/Admin/MarketplaceOperationsOverview.jsx](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/src/components/Admin/MarketplaceOperationsOverview.jsx)
  - already exposes marketplace operations summary
- traveler-facing pages already consume availability summaries in discovery and detail surfaces

This means the next phase is primarily a workflow and operations-layer improvement, not a greenfield availability system.

## Workspace Structure

The new admin area should live under tenant admin distribution/marketplace tools as a dedicated screen:

- `Marketplace Availability`

Primary screen regions:

1. `Filters Bar`
- package selector
- month selector
- status filter
- instant-ready only
- request-only only
- search by package name

2. `Operations Table`
- one row per departure entry
- cross-tour view
- optimized for high-frequency edits

3. `Bulk Actions Bar`
- appears when rows are selected
- supports bulk status, publish behavior, and seat changes

4. `Tour Schedule Drawer`
- focused editor for one package's full date schedule
- supports add/edit/remove
- supports weekly-template review and manual overrides

5. `Availability Health Panel`
- highlights issues that reduce marketplace trust or booking readiness

## Primary Workflow

Daily operator workflow:

1. open `Marketplace Availability`
2. review upcoming departures across tours
3. filter to the relevant date range or status
4. edit rows inline:
   - status
   - remaining spots
   - note
5. use bulk actions for repetitive changes
6. open a package drawer for deeper scheduling work
7. resolve health warnings
8. save and leave the marketplace with current, believable departure data

## Operations Table

Each row should represent one availability entry from one package.

Recommended columns:

- package
- destination/location
- departure date
- status
- remaining spots
- note
- source
  - `manual`
  - `generated`
- bookable
- instant-ready
- last update indicator

Inline row actions:

- set status
- update remaining spots
- edit note
- open package drawer

Status meanings:

- `available`: published and open
- `limited`: published with limited remaining spots
- `unavailable`: published but not open
- `on-request`: traveler can inquire, but operator is not promising guaranteed stock

## Tour Schedule Drawer

The drawer is the focused per-package view.

It should support:

- viewing all current availability entries for a single package
- adding a new date manually
- changing a date's status
- changing remaining spots
- updating the note
- deleting a date
- reviewing generated dates from weekly rules
- overriding generated dates with manual values
- reviewing package-level settings that affect generation

The drawer should not replace package editing entirely. It should expose the most relevant operational subset and link back to full package setup when deeper changes are needed.

## Bulk Actions

Bulk actions should support:

- mark selected rows `available`
- mark selected rows `limited`
- mark selected rows `unavailable`
- mark selected rows `on-request`
- increase spots by N
- decrease spots by N
- clear note
- set shared note

Phase 1 should avoid overly broad destructive actions. The emphasis should be fast, safe operations rather than complex automation.

## Availability Health

The health panel should highlight problems that weaken traveler confidence or operator readiness.

Initial warning set:

- marketplace-visible package has no published dates
- instant booking enabled but no instant-bookable dates qualify
- limited departure has no valid spot count
- unavailable or past dates are still cluttering future operations
- generated schedule exists but all upcoming dates are blocked
- request-only package has no useful operator note

Each warning should point back to the affected package or drawer.

## Data Model Strategy

Keep the existing embedded model in `TourPackage` for this phase.

Reason:

- the repo already stores marketplace availability there
- summaries and traveler views already depend on it
- this avoids risky migration work
- the next feature need is operational workflow, not storage redesign

No new collection is required in phase 1.

Optional metadata additions:

- `lastAvailabilityUpdateAt`
- `lastAvailabilityUpdatedBy`

These are recommended but not mandatory for the first pass. If added, they should live in a low-risk part of the tour document or the availability update pipeline.

## Backend Design

Add a marketplace availability operations layer that shapes embedded tour availability into admin-ready rows.

Recommended additions:

1. operations row builder utility
- input: tours with availability summaries
- output: flattened row list across packages

2. health warning utility
- input: package + summary
- output: warning records with severity and reason

3. routes for:
- listing availability rows across tours
- fetching one package schedule
- updating a single departure
- creating a departure
- deleting a departure
- bulk updating selected departures

4. preserve current summary builder
- traveler-facing discovery should continue to use the current availability summary logic

## Frontend Design

Recommended new components:

- `MarketplaceAvailabilityManager`
- `AvailabilityFiltersBar`
- `AvailabilityOperationsTable`
- `AvailabilityBulkActionsBar`
- `TourScheduleDrawer`
- `AvailabilityHealthPanel`

The admin experience should feel more operational than form-driven:

- fast scanning
- compact rows
- obvious state badges
- clear bulk selection
- focused drawer editing

This should align visually with the stronger admin work done recently in Template Studio and marketplace operations.

## Integration With Existing Screens

Existing screens should stay, but their roles become clearer:

- `Packages`
  - package setup and defaults
- `Marketplace Operations Snapshot`
  - summary and monitoring
- `Marketplace Availability`
  - active departure control surface

The snapshot card may later deep-link into filtered views inside the new availability workspace.

## Traveler-Facing Effects

This phase is primarily admin-facing, but it should improve traveler-facing quality by improving the underlying data.

Expected outcomes:

- cleaner next departure signals
- fewer stale dates
- more credible limited-availability messaging
- clearer request-only packages
- better saved-trip reminder accuracy
- stronger instant-booking confidence

No major traveler UI rewrite is required in this phase.

## Testing

### Backend

- operations row shaping
- summary compatibility with manual and generated entries
- bulk status updates
- bulk seat adjustments
- manual override behavior on generated schedules
- health warning logic

### Frontend

- filters
- inline row edits
- bulk selection and action application
- drawer add/edit/remove
- health panel rendering

### Verification

- `npm run build`
- relevant new backend tests
- relevant new frontend tests

## Rollout Plan

### Phase 1

- new availability workspace
- operations table
- filters
- inline updates
- per-tour drawer
- health warnings

### Phase 2

- bulk operations
- deeper generated-date override workflow
- stronger table-to-drawer links

### Phase 3

- polish
- stronger reminder-quality hooks
- optional analytics hooks

## Success Criteria

- operator can manage departures across many tours without opening each package editor
- guaranteed and request-only availability coexist clearly
- marketplace-visible tours are easier to keep current
- saved-trip and inquiry flows receive cleaner availability context
- instant-booking readiness is easier to manage operationally

## Risks And Mitigations

### Risk: duplicate workflow with package editor

Mitigation:
- clearly separate setup vs operations roles
- keep deep configuration in package editor
- keep high-frequency changes in the new workspace

### Risk: inconsistent generated vs manual entries

Mitigation:
- preserve current summary engine
- explicitly show row source
- ensure drawer edits can override generated behavior safely

### Risk: overcomplicated bulk actions

Mitigation:
- start with a small, high-confidence set
- avoid destructive automation in phase 1

## Recommendation

Proceed with a dedicated `Marketplace Availability` operations workspace built on top of the existing hybrid availability foundation already present in the repo.

This is the strongest next marketplace feature because it improves operational speed, traveler trust, and conversion quality without requiring a risky data-model rewrite.
