# Template Marketplace Assignment Design

Date: 2026-05-20
Repo: `C:\Users\SFG DESIGN\Desktop\tour-mazex-pedition`
Status: Draft for review

## Goal

Finish the `Template Marketplace` so platform-owned website templates can be assigned to tenants in a controlled way, then personalized through `Template Studio` without allowing tenants to overwrite the platform master template.

This phase should answer three product questions clearly:

- `Which master template is active for this tenant?`
- `What can the tenant personalize safely?`
- `How does the public tenant site render the assigned design without turning into a freeform fork?`

## Product Decision

Use a `platform-owned master template + tenant assignment + tenant personalization layer` model.

That means:

- platform admin owns master templates
- a tenant can have one active assigned website template at a time
- the tenant does not directly own or mutate the master
- the tenant personalizes through `Template Studio`
- the public site renders `master template + tenant personalization + tenant CMS content`

## Scope

### In scope

- platform admin assigning one active master template to a tenant
- tenant assignment records and history
- template-assignment visibility in admin/template marketplace surfaces
- `Template Studio` loading in assignment-aware personalization mode
- locked vs editable boundaries for assigned templates
- tenant public rendering resolving assigned template baseline plus personalization

### Out of scope

- direct tenant purchase or checkout
- tenant-owned full template forks
- multi-template live site mixing across core website pages
- release-channel or staged rollout system for template upgrades
- campaign microsite template branching beyond the one active site template

## Existing Foundation In Repo

The platform already has meaningful groundwork:

- [src/pageBuilder/templateMarketplace.js](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/src/pageBuilder/templateMarketplace.js)
  - built-in marketplace template catalog
  - purchase/included status helpers
  - per-tenant catalog resolution helpers
- [backend/models/PageBuilderTemplate.js](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/backend/models/PageBuilderTemplate.js)
  - persisted platform-created templates
  - metadata, theme tokens, and sections
- [src/pages/TemplateMarketplace.jsx](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/src/pages/TemplateMarketplace.jsx)
  - public-facing template browsing surface
- [src/components/Admin/PageBuilderManager.jsx](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/src/components/Admin/PageBuilderManager.jsx)
  - existing page-builder and template application logic
  - current template marketplace hooks
  - `Template Studio` integration entry
- [src/components/Admin/TemplateStudio/TemplateStudioShell.jsx](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/src/components/Admin/TemplateStudio/TemplateStudioShell.jsx)
  - advanced editing shell
  - import/bind/canvas/history/publish foundation

This means the missing feature is not “build templates.” It is “finish ownership, assignment, and controlled personalization.”

## Product Workflow

The clean workflow should be:

1. `Platform admin manages master templates`
   - create or publish templates
   - mark templates marketplace-visible
   - assign a template to a tenant
   - switch a tenant to a different template later if needed

2. `Tenant receives one active assigned template`
   - the tenant does not own the master
   - the tenant cannot overwrite master structure directly
   - the tenant personalizes the assigned design through `Template Studio`

3. `Template Studio edits a personalization layer`
   - theme token overrides
   - page-level style overrides
   - allowed content edits
   - CMS bindings
   - approved inserted reusable sections
   - page-specific override state

4. `Public tenant site renders the assigned stack`
   - master template baseline
   - tenant personalization layer
   - tenant CMS content

## Core Product Rules

- one tenant has one active website template at a time
- assignment changes the tenant’s design baseline
- `Template Studio` changes how that baseline is personalized
- page builder does not become a freeform master-template forking tool
- tenants can personalize inside approved boundaries, not dissolve the platform design system

## Data Model

The design should use three layers.

### 1. Platform master template

This remains platform-owned.

It should represent:

- template id
- name
- category
- preview assets
- published status
- marketplace visibility
- base page structures
- base section structures
- default theme tokens
- source metadata

The existing `PageBuilderTemplate` model and built-in registry already cover much of this baseline.

### 2. Tenant template assignment

This is the new control record.

It should represent:

- tenant id
- assigned master template id
- assignment status
- assigned at
- assigned by
- active flag
- optional note/history metadata

Rule:

- a tenant may have historical assignments
- but only one active assignment can control the main website at a time

### 3. Tenant personalization layer

This is what `Template Studio` should persist against.

It should represent:

- tenant id
- active master template id
- theme token overrides
- page-specific overrides
- allowed section content overrides
- CMS bindings
- inserted reusable sections
- snapshot/version history

Important boundary:

- master template stores the structural baseline
- personalization stores tenant-specific edits
- tenant does not directly mutate platform master records

## Template Studio Behavior

Once a tenant has an assigned master template, `Template Studio` should open in an assignment-aware controlled mode.

### Tenant can do

- personalize theme tokens
- edit allowed text/content areas
- bind sections to tenant CMS data
- insert approved reusable sections
- reorder sections where rules explicitly allow it
- save page-level personalized variants
- use snapshots and restore versions

### Tenant cannot do

- overwrite the platform master template
- detach the whole assigned site into an uncontrolled fork
- remove required structural sections if the template marks them locked
- change ownership or template system metadata

### Required studio UX

`Template Studio` should show:

1. `Assigned template banner`
   - active assigned template
   - platform ownership
   - message that the tenant is editing personalization only

2. `Locked vs editable sections`
   - locked structure
   - editable content
   - editable style
   - editable binding
   - insert allowed above/below or not

3. `Page rules`
   - some pages can be more open
   - some pages remain partially locked
   - some pages can be required in the site structure

## Switching Templates Later

If platform admin assigns a new master template later:

- the system should preserve assignment history
- the old personalization history should remain stored for reference or rollback
- the new assignment should either:
  - start a fresh personalization layer
  - or remap only when compatibility is explicit and safe

This phase should prefer safety over magical migration.

So the default rule should be:

- new assignment creates a new active personalization layer
- old personalization remains archived against the previous assignment

## Rendering Model

Public tenant rendering should resolve in this order:

1. active tenant template assignment
2. assigned master template structure
3. tenant personalization overrides
4. tenant CMS data bindings and content

This keeps the website coherent while still allowing tenant customization.

## Admin Experience

### Platform admin should be able to

- browse all platform-owned templates
- see published vs draft templates
- see which tenants use which template
- assign a template to a tenant
- switch the active assigned template
- inspect assignment history

### Tenant should be able to

- see which template is assigned
- open it in `Template Studio`
- personalize within the allowed boundaries
- not see confusing ownership controls meant only for platform admins

## Technical Shape

This should fit the repo without a redesign of the template system.

### Backend additions

- add a tenant template assignment model
- add assignment read/write routes for platform admin
- add active assignment resolution for tenant-facing studio/public rendering
- keep this additive to the existing `PageBuilderTemplate` and template catalog logic

### Frontend additions

- platform admin assignment UI in the template marketplace/admin surface
- assignment-aware loading in `PageBuilderManager` / `Template Studio`
- locked/editable affordances in the studio
- active assigned-template state in tenant-facing page-builder/template flows

### Architecture principle

This phase should not replace the current template marketplace.

It should layer:

- ownership
- assignment
- controlled personalization

on top of the existing marketplace and studio foundation.

## Rollout Order

### Phase 1: Assignment foundation

- tenant template assignment model
- platform admin assignment UI
- active assignment APIs
- one-active-template-per-tenant enforcement

### Phase 2: Studio controlled personalization

- assigned-template banner
- locked vs editable section boundaries
- personalization saved separately from master template
- assignment-aware studio loading

### Phase 3: Tenant rendering integration

- public tenant rendering resolves assigned master + personalization + CMS data
- admin/template marketplace surfaces show assignment status
- safe reassignment behavior when platform admin switches the active template

## Validation

### Product validation questions

After this phase, the platform should answer all of these clearly:

- which master template controls this tenant site?
- can the tenant personalize it without corrupting the master?
- can platform admin switch templates safely?
- does the public site reflect the assigned template plus tenant changes?

### Verification

- backend tests for assignment model/rules
- backend tests for active-assignment resolution
- frontend tests for assignment-aware template marketplace and studio logic
- `npm run build`

## Success Criteria

This phase is successful if:

- platform admin can assign one active master template to a tenant
- tenant can personalize the assigned template through `Template Studio`
- tenant cannot mutate the platform master template directly
- the public tenant site resolves the assigned master plus tenant personalization correctly
- template ownership boundaries are clear in both data model and UI

## Future Phases

- real template entitlement / billing flow
- campaign or landing-page-only secondary templates
- safer compatibility-aware remapping between template families
- release channels and staged template upgrades
