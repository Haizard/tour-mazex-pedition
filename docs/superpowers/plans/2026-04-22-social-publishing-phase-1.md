# Social Publishing Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tenant-admin Social Posts workspace that generates Facebook and Instagram post drafts from tour packages, supports editing and scheduling, and stores an integration-ready publishing queue.

**Architecture:** The backend gains a tenant-scoped `SocialPost` domain with deterministic generation utilities, CRUD endpoints, and validation around platforms, images, and schedules. The frontend gains a new admin manager integrated into the existing dashboard/sidebar, plus API helpers for listing, generating, creating, updating, and deleting social posts.

**Tech Stack:** React 18, Express 5, Mongoose, Axios, existing tenant middleware/admin auth, existing Tailwind-based admin UI

---

## File Structure

**Create:**

- `backend/models/SocialPost.js`
- `backend/controllers/socialPostController.js`
- `backend/routes/socialPostRoutes.js`
- `backend/utils/socialPostGeneration.js`
- `src/components/Admin/SocialPostsManager.jsx`

**Modify:**

- `backend/server.js`
- `src/services/api.js`
- `src/components/Admin/AdminSidebar.jsx`
- `src/pages/AdminDashboard.jsx`

## Task 1: Add the Social Post backend model and generator

**Files:**
- Create: `backend/models/SocialPost.js`
- Create: `backend/utils/socialPostGeneration.js`

- [ ] **Step 1: Write the failing test mentally against the model contract**

Expected behaviors:

```js
// SocialPost should require at least one platform
// SocialPost should reject unknown platforms
// SocialPost should require scheduledFor when status === "scheduled"
// Generator should always return fallback content even without AI
```

- [ ] **Step 2: Verify the gap exists**

Run:

```bash
dir backend\models\SocialPost.js
dir backend\utils\socialPostGeneration.js
```

Expected: files do not exist yet

- [ ] **Step 3: Write minimal implementation**

Create a Mongoose schema with:

```js
platforms: [{ type: String, enum: ["instagram", "facebook"], required: true }]
status: { type: String, enum: ["draft", "scheduled", "ready", "published", "failed"], default: "draft" }
```

Add a pre-validation rule so `scheduledFor` is required for `scheduled`, and add a deterministic generator that builds:

```js
{
  title,
  caption,
  alternativeCaptions,
  hashtags,
  callToAction,
  imageCandidates,
  generationMeta
}
```

- [ ] **Step 4: Run sanity verification**

Run:

```bash
node -e "import('./backend/models/SocialPost.js').then(()=>console.log('social-model-ok'))"
node -e "import('./backend/utils/socialPostGeneration.js').then(async (m)=>{const data=await m.generateSocialPostSuggestions({title:'Serengeti Escape',location:'Serengeti',duration:'5 Days',description:'See the migration',image:'hero.jpg',galleryImages:['one.jpg']}); console.log(Boolean(data.caption && data.hashtags?.length));})"
```

Expected:

- First command prints `social-model-ok`
- Second command prints `true`

- [ ] **Step 5: Commit**

```bash
git add backend/models/SocialPost.js backend/utils/socialPostGeneration.js
git commit -m "feat: add social post model and generator"
```

## Task 2: Add backend controller, routes, and server wiring

**Files:**
- Create: `backend/controllers/socialPostController.js`
- Create: `backend/routes/socialPostRoutes.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Write the failing test mentally against API behavior**

Expected behaviors:

```js
// POST /api/social-posts/generate returns suggestions for a tenant-owned tour
// GET /api/social-posts returns tenant-scoped posts
// POST /api/social-posts persists a draft or scheduled post
// PATCH /api/social-posts/:id updates a tenant-owned post
// DELETE /api/social-posts/:id removes a tenant-owned post
```

- [ ] **Step 2: Verify the route gap exists**

Run:

```bash
dir backend\routes\socialPostRoutes.js
Select-String -Path backend\server.js -Pattern "social-posts"
```

Expected: route file missing and no route registration found

- [ ] **Step 3: Write minimal implementation**

Implement controller methods:

```js
generateSocialPostDraft
getSocialPosts
createSocialPost
updateSocialPost
deleteSocialPost
```

Rules:

- Tenant ownership enforced through `buildTenantFilter`
- `generate` must reject missing/foreign tour ids
- scheduling in the past must be rejected
- scheduling without images must be rejected

Wire route prefix:

```js
app.use('/api/social-posts', socialPostRoutes);
```

- [ ] **Step 4: Run verification**

Run:

```bash
node -e "import('./backend/routes/socialPostRoutes.js').then(()=>console.log('social-routes-ok'))"
node -e "import('./backend/controllers/socialPostController.js').then((m)=>console.log(Object.keys(m).sort().join(',')))"
```

Expected:

- First command prints `social-routes-ok`
- Second command includes `createSocialPost`, `deleteSocialPost`, `generateSocialPostDraft`, `getSocialPosts`, `updateSocialPost`

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/socialPostController.js backend/routes/socialPostRoutes.js backend/server.js
git commit -m "feat: add social post api"
```

## Task 3: Add frontend API helpers and admin navigation

**Files:**
- Modify: `src/services/api.js`
- Modify: `src/components/Admin/AdminSidebar.jsx`

- [ ] **Step 1: Write the failing test mentally against frontend integration**

Expected behaviors:

```js
// api.js exposes fetch/generate/create/update/delete helpers for social posts
// sidebar exposes a Social Posts tab
```

- [ ] **Step 2: Verify the gap exists**

Run:

```bash
Select-String -Path src\services\api.js -Pattern "social-post"
Select-String -Path src\components\Admin\AdminSidebar.jsx -Pattern "Social Posts"
```

Expected: no matches

- [ ] **Step 3: Write minimal implementation**

Add helpers:

```js
fetchSocialPosts()
generateSocialPost(data)
createSocialPost(data)
updateSocialPost(id, data)
deleteSocialPost(id)
```

Add sidebar tab:

```js
{ id: "social-posts", label: "Social Posts", icon: <...> }
```

- [ ] **Step 4: Run verification**

Run:

```bash
Select-String -Path src\services\api.js -Pattern "fetchSocialPosts|generateSocialPost|createSocialPost|updateSocialPost|deleteSocialPost"
Select-String -Path src\components\Admin\AdminSidebar.jsx -Pattern "social-posts|Social Posts"
```

Expected: helper names and sidebar entry are present

- [ ] **Step 5: Commit**

```bash
git add src/services/api.js src/components/Admin/AdminSidebar.jsx
git commit -m "feat: wire social posts api in admin shell"
```

## Task 4: Build the Social Posts admin manager

**Files:**
- Create: `src/components/Admin/SocialPostsManager.jsx`
- Modify: `src/pages/AdminDashboard.jsx`

- [ ] **Step 1: Write the failing test mentally against UI behavior**

Expected behaviors:

```js
// Admin can load tours and social posts
// Admin can select a tour and generate a post draft
// Admin can edit caption/hashtags/platforms/schedule
// Admin can save a draft or scheduled post
// Admin can reopen and delete items from the queue
```

- [ ] **Step 2: Verify the component gap exists**

Run:

```bash
dir src\components\Admin\SocialPostsManager.jsx
Select-String -Path src\pages\AdminDashboard.jsx -Pattern "social-posts|SocialPostsManager"
```

Expected: component missing and dashboard has no integration

- [ ] **Step 3: Write minimal implementation**

Create a focused admin manager with:

- top summary badges
- status filter
- left-side queue list
- right-side editor form
- `Create Post` workflow from available tours
- generate/save/update/delete actions

Mount it from `AdminDashboard.jsx` when:

```js
activeTab === 'social-posts'
```

- [ ] **Step 4: Run verification**

Run:

```bash
npm run build
```

Expected: frontend build succeeds with the new manager mounted in the dashboard

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/SocialPostsManager.jsx src/pages/AdminDashboard.jsx
git commit -m "feat: add social posts admin manager"
```

## Task 5: Full verification and regression pass

**Files:**
- Modify: any files needed for build/lint fixes

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: no lint errors

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: build completes successfully

- [ ] **Step 3: Smoke-check backend module imports**

Run:

```bash
node -e "import('./backend/server.js').then(()=>console.log('server-import-ok'))"
```

Expected: server imports without syntax errors

- [ ] **Step 4: Review changed files**

Run:

```bash
git diff --stat
```

Expected: diff is limited to the social publishing Phase 1 feature and docs

- [ ] **Step 5: Commit**

```bash
git add backend src docs
git commit -m "feat: add social publishing phase 1"
```
