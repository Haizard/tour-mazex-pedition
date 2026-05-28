# Platform Growth Outreach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a platform-admin Growth Outreach workspace that imports public-source tour-company prospects, generates platform-branded LLM outreach, gates live email/WhatsApp/social sending on provider readiness, auto-replies within sales guardrails, and logs every decision.

**Architecture:** Add platform-owned Mongo models and `/api/platform-admin/outreach/*` routes rather than reusing tenant-scoped marketing records. Keep provider integrations behind small adapter/readiness utilities so the first live implementation can validate credentials, queue messages safely, and use mocked provider clients in tests. Add a platform-admin UI section that reads these routes and exposes prospects, campaigns, messages, social posts, and readiness.

**Tech Stack:** Express, Mongoose, Node `node:test`, React, Vite, existing platform-admin auth middleware, existing Redis queue pattern where available, Meta/WhatsApp/email adapters behind server utilities.

---

## File Structure

Create backend models:

- `backend/models/PlatformOutreachProspect.js`: platform-owned prospect records and duplicate indexes.
- `backend/models/PlatformOutreachCampaign.js`: platform-owned campaign metadata.
- `backend/models/PlatformOutreachMessage.js`: queued/generated/inbound messages.
- `backend/models/PlatformOutreachThread.js`: conversation state per prospect/channel.
- `backend/models/PlatformSocialPost.js`: platform-owned social posts.
- `backend/models/PlatformOutreachEventLog.js`: append-only audit records.
- `backend/models/PlatformOutreachSettings.js`: platform sender identity and provider readiness config without exposing raw secrets.

Create backend utilities:

- `backend/utils/platformOutreachProspects.js`: contact normalization, import validation, duplicate keys, suppression decisions.
- `backend/utils/platformOutreachCompliance.js`: email unsubscribe and WhatsApp opt-in gates.
- `backend/utils/platformOutreachGeneration.js`: LLM prompt construction, deterministic guardrail classifier, generated payload validation.
- `backend/utils/platformOutreachProviders.js`: email, WhatsApp, and social provider readiness plus adapter interfaces.
- `backend/utils/platformOutreachQueue.js`: queue job builders and Redis-safe enqueue helpers.
- `backend/utils/platformOutreachProcessor.js`: due-message processing with readiness and suppression rechecks.

Create routes:

- `backend/routes/platformOutreachRoutes.js`: all `/api/platform-admin/outreach/*` endpoints.
- Modify `backend/server.js`: mount `platformOutreachRoutes` at `/api/platform-admin/outreach`.

Create frontend files:

- `src/components/PlatformAdmin/GrowthOutreachManager.jsx`: platform-admin workspace UI.
- Modify `src/pages/platformAdminNavigation.js`: add `Growth Outreach`.
- Modify `src/pages/PlatformAdminDashboard.jsx`: render the new primary section.
- Modify `src/services/api.js`: add platform outreach API helpers.

Create tests:

- `backend/tests/platformOutreachProspects.test.js`
- `backend/tests/platformOutreachCompliance.test.js`
- `backend/tests/platformOutreachGeneration.test.js`
- `backend/tests/platformOutreachProviders.test.js`
- `backend/tests/platformOutreachRoutes.test.js`
- `backend/tests/platformOutreachProcessor.test.js`
- `src/pages/platformAdminNavigation.test.js`

---

### Task 1: Prospect Normalization And Model

**Files:**
- Create: `backend/models/PlatformOutreachProspect.js`
- Create: `backend/utils/platformOutreachProspects.js`
- Test: `backend/tests/platformOutreachProspects.test.js`

- [ ] **Step 1: Write prospect utility tests**

Create `backend/tests/platformOutreachProspects.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlatformProspectPayload,
  buildProspectDuplicateQuery,
  normalizeEmail,
  normalizeWhatsAppNumber,
} from "../utils/platformOutreachProspects.js";

test("normalizeEmail trims and lowercases email addresses", () => {
  assert.equal(normalizeEmail("  Sales@KILI-TOURS.COM "), "sales@kili-tours.com");
});

test("normalizeWhatsAppNumber keeps a leading plus and digits", () => {
  assert.equal(normalizeWhatsAppNumber(" +255 712-345-678 "), "+255712345678");
});

test("buildPlatformProspectPayload requires at least one contact channel", () => {
  assert.throws(
    () => buildPlatformProspectPayload({ companyName: "Kili Tours", sourceUrl: "https://example.com" }),
    /email or WhatsApp number/i
  );
});

test("buildPlatformProspectPayload requires public source attribution", () => {
  assert.throws(
    () => buildPlatformProspectPayload({ companyName: "Kili Tours", email: "sales@example.com" }),
    /source URL/i
  );
});

test("buildPlatformProspectPayload creates a clean cold-prospect record", () => {
  const payload = buildPlatformProspectPayload({
    companyName: " Kili Tours ",
    contactName: "Sales Team",
    email: " SALES@EXAMPLE.COM ",
    whatsappNumber: " +255 700 111 222 ",
    website: "HTTPS://EXAMPLE.COM/",
    country: "Tanzania",
    sourceUrl: "https://directory.example.com/kili",
    tags: "safari, arusha",
  });

  assert.equal(payload.companyName, "Kili Tours");
  assert.equal(payload.email, "sales@example.com");
  assert.equal(payload.whatsappNumber, "+255700111222");
  assert.equal(payload.website, "https://example.com");
  assert.equal(payload.sourceUrl, "https://directory.example.com/kili");
  assert.deepEqual(payload.tags, ["safari", "arusha"]);
  assert.equal(payload.status, "new");
  assert.equal(payload.emailOptOut, false);
  assert.equal(payload.whatsappOptInStatus, "unknown");
});

test("buildProspectDuplicateQuery prefers normalized contact fields", () => {
  const query = buildProspectDuplicateQuery({
    email: "sales@example.com",
    whatsappNumber: "+255700111222",
    website: "https://example.com",
  });

  assert.deepEqual(query, {
    $or: [
      { email: "sales@example.com" },
      { whatsappNumber: "+255700111222" },
      { website: "https://example.com" },
    ],
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/platformOutreachProspects.test.js`

Expected: FAIL with module not found for `platformOutreachProspects.js`.

- [ ] **Step 3: Implement prospect utilities**

Create `backend/utils/platformOutreachProspects.js`:

```js
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
]);

const trimString = (value = "") => String(value || "").trim();

const normalizeUrl = (value = "") => {
  const raw = trimString(value);
  if (!raw) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch (_error) {
    return raw.toLowerCase().replace(/\/$/, "");
  }
};

export const normalizeEmail = (value = "") => trimString(value).toLowerCase();

export const normalizeWhatsAppNumber = (value = "") => {
  const raw = trimString(value);
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D+/g, "");
  return digits ? `${hasPlus ? "+" : ""}${digits}` : "";
};

const normalizeTags = (tags = []) => {
  const values = Array.isArray(tags) ? tags : String(tags || "").split(/[,\n]/);
  return [...new Set(values.map((tag) => trimString(tag)).filter(Boolean))];
};

export const isPersonalEmail = (email = "") => {
  const domain = normalizeEmail(email).split("@")[1] || "";
  return PERSONAL_EMAIL_DOMAINS.has(domain);
};

export const buildPlatformProspectPayload = (body = {}) => {
  const email = normalizeEmail(body.email);
  const whatsappNumber = normalizeWhatsAppNumber(body.whatsappNumber);
  const sourceUrl = normalizeUrl(body.sourceUrl);

  if (!email && !whatsappNumber) {
    throw new Error("A prospect needs an email or WhatsApp number.");
  }

  if (!sourceUrl) {
    throw new Error("A public source URL is required for cold outreach prospects.");
  }

  return {
    companyName: trimString(body.companyName || body.name),
    contactName: trimString(body.contactName),
    email,
    whatsappNumber,
    website: normalizeUrl(body.website),
    country: trimString(body.country),
    sourceUrl,
    sourceType: trimString(body.sourceType || "public-source"),
    tags: normalizeTags(body.tags),
    status: trimString(body.status || "new"),
    emailOptOut: body.emailOptOut === true,
    whatsappOptInStatus: trimString(body.whatsappOptInStatus || "unknown"),
    whatsappOptInSource: trimString(body.whatsappOptInSource),
    metadata: body.metadata || {},
  };
};

export const buildProspectDuplicateQuery = ({ email = "", whatsappNumber = "", website = "" } = {}) => {
  const clauses = [];
  if (email) clauses.push({ email });
  if (whatsappNumber) clauses.push({ whatsappNumber });
  if (website) clauses.push({ website });
  return clauses.length ? { $or: clauses } : { _id: null };
};
```

- [ ] **Step 4: Implement prospect model**

Create `backend/models/PlatformOutreachProspect.js`:

```js
import mongoose from "mongoose";

export const PLATFORM_OUTREACH_PROSPECT_STATUSES = [
  "new",
  "queued",
  "contacted",
  "replied",
  "qualified",
  "unqualified",
  "opted_out",
  "blocked",
];

export const WHATSAPP_OPT_IN_STATUSES = ["unknown", "opted_in", "not_opted_in", "opted_out"];

const platformOutreachProspectSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    whatsappNumber: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    sourceUrl: { type: String, required: true, trim: true },
    sourceType: { type: String, trim: true, default: "public-source" },
    tags: { type: [String], default: [] },
    status: { type: String, enum: PLATFORM_OUTREACH_PROSPECT_STATUSES, default: "new" },
    emailOptOut: { type: Boolean, default: false },
    whatsappOptInStatus: { type: String, enum: WHATSAPP_OPT_IN_STATUSES, default: "unknown" },
    whatsappOptInSource: { type: String, trim: true, default: "" },
    lastContactedAt: { type: Date, default: null },
    lastReplyAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

platformOutreachProspectSchema.index({ email: 1 }, { sparse: true });
platformOutreachProspectSchema.index({ whatsappNumber: 1 }, { sparse: true });
platformOutreachProspectSchema.index({ website: 1 }, { sparse: true });
platformOutreachProspectSchema.index({ status: 1, updatedAt: -1 });

const PlatformOutreachProspect =
  mongoose.models.PlatformOutreachProspect ||
  mongoose.model("PlatformOutreachProspect", platformOutreachProspectSchema);

export default PlatformOutreachProspect;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test backend/tests/platformOutreachProspects.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add backend/models/PlatformOutreachProspect.js backend/utils/platformOutreachProspects.js backend/tests/platformOutreachProspects.test.js
git commit -m "feat: add platform outreach prospect model"
```

---

### Task 2: Compliance And Provider Readiness Utilities

**Files:**
- Create: `backend/models/PlatformOutreachSettings.js`
- Create: `backend/utils/platformOutreachCompliance.js`
- Create: `backend/utils/platformOutreachProviders.js`
- Test: `backend/tests/platformOutreachCompliance.test.js`
- Test: `backend/tests/platformOutreachProviders.test.js`

- [ ] **Step 1: Write compliance tests**

Create `backend/tests/platformOutreachCompliance.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  assertCanSendPlatformMessage,
  classifyOptOutIntent,
} from "../utils/platformOutreachCompliance.js";

test("classifyOptOutIntent detects email unsubscribe language", () => {
  assert.equal(classifyOptOutIntent("please unsubscribe me"), "opt_out");
  assert.equal(classifyOptOutIntent("STOP"), "opt_out");
  assert.equal(classifyOptOutIntent("tell me about pricing"), "none");
});

test("email sending is blocked when prospect opted out", () => {
  assert.throws(
    () => assertCanSendPlatformMessage({ channel: "email", prospect: { emailOptOut: true } }),
    /email opt-out/i
  );
});

test("whatsapp marketing is blocked without opt-in", () => {
  assert.throws(
    () =>
      assertCanSendPlatformMessage({
        channel: "whatsapp",
        prospect: { whatsappOptInStatus: "unknown" },
      }),
    /WhatsApp opt-in/i
  );
});

test("whatsapp marketing is allowed when prospect is opted in", () => {
  assert.doesNotThrow(() =>
    assertCanSendPlatformMessage({
      channel: "whatsapp",
      prospect: { whatsappOptInStatus: "opted_in" },
    })
  );
});
```

- [ ] **Step 2: Write provider readiness tests**

Create `backend/tests/platformOutreachProviders.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  resolvePlatformEmailReadiness,
  resolvePlatformSocialReadiness,
  resolvePlatformWhatsAppReadiness,
} from "../utils/platformOutreachProviders.js";

test("email readiness requires sender identity and unsubscribe endpoint", () => {
  const readiness = resolvePlatformEmailReadiness({
    settings: { email: { senderEmail: "sales@mazex.com" } },
    env: { PLATFORM_EMAIL_API_KEY: "key" },
  });

  assert.equal(readiness.ready, false);
  assert.match(readiness.message, /unsubscribe/i);
});

test("email readiness passes with required config", () => {
  const readiness = resolvePlatformEmailReadiness({
    settings: {
      email: {
        senderEmail: "sales@mazex.com",
        senderName: "Mazex",
        postalAddress: "123 Market Street",
        unsubscribeBaseUrl: "https://mazex.example/unsubscribe",
      },
    },
    env: { PLATFORM_EMAIL_API_KEY: "key" },
  });

  assert.equal(readiness.ready, true);
});

test("whatsapp readiness requires Meta identifiers", () => {
  const readiness = resolvePlatformWhatsAppReadiness({
    settings: { whatsapp: { phoneNumberId: "phone" } },
    env: { PLATFORM_WHATSAPP_ACCESS_TOKEN: "token" },
  });

  assert.equal(readiness.ready, false);
  assert.match(readiness.message, /Business Account/i);
});

test("social readiness requires page and instagram identifiers for both platforms", () => {
  const readiness = resolvePlatformSocialReadiness({
    settings: { social: { facebookPageId: "page" } },
    platforms: ["facebook", "instagram"],
    env: { PLATFORM_META_ACCESS_TOKEN: "token" },
  });

  assert.equal(readiness.ready, false);
  assert.match(readiness.message, /Instagram/i);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --test backend/tests/platformOutreachCompliance.test.js backend/tests/platformOutreachProviders.test.js`

Expected: FAIL with missing utility modules.

- [ ] **Step 4: Implement compliance utility**

Create `backend/utils/platformOutreachCompliance.js`:

```js
const OPT_OUT_TERMS = ["unsubscribe", "stop", "remove me", "do not contact", "don't contact"];

export const classifyOptOutIntent = (text = "") => {
  const normalized = String(text || "").trim().toLowerCase();
  return OPT_OUT_TERMS.some((term) => normalized.includes(term)) ? "opt_out" : "none";
};

export const assertCanSendPlatformMessage = ({ channel = "", prospect = {} } = {}) => {
  if (channel === "email" && prospect.emailOptOut === true) {
    throw new Error("This prospect has an email opt-out record.");
  }

  if (channel === "whatsapp") {
    if (prospect.whatsappOptInStatus === "opted_out") {
      throw new Error("This prospect has opted out of WhatsApp outreach.");
    }

    if (prospect.whatsappOptInStatus !== "opted_in") {
      throw new Error("WhatsApp opt-in evidence is required before sending marketing outreach.");
    }
  }

  return true;
};
```

- [ ] **Step 5: Implement provider readiness utility**

Create `backend/utils/platformOutreachProviders.js`:

```js
const present = (value = "") => Boolean(String(value || "").trim());

const notReady = (channel, message, missing = []) => ({
  channel,
  ready: false,
  message,
  missing,
});

const ready = (channel) => ({
  channel,
  ready: true,
  message: "",
  missing: [],
});

export const resolvePlatformEmailReadiness = ({ settings = {}, env = process.env } = {}) => {
  const email = settings.email || {};
  const missing = [];
  if (!present(env.PLATFORM_EMAIL_API_KEY) && !present(env.PLATFORM_SMTP_HOST)) missing.push("email provider credentials");
  if (!present(email.senderEmail)) missing.push("sender email");
  if (!present(email.senderName)) missing.push("sender name");
  if (!present(email.postalAddress)) missing.push("postal address");
  if (!present(email.unsubscribeBaseUrl)) missing.push("unsubscribe endpoint");

  return missing.length
    ? notReady("email", `Email readiness failed: missing ${missing.join(", ")}.`, missing)
    : ready("email");
};

export const resolvePlatformWhatsAppReadiness = ({ settings = {}, env = process.env } = {}) => {
  const whatsapp = settings.whatsapp || {};
  const missing = [];
  if (!present(env.PLATFORM_WHATSAPP_ACCESS_TOKEN)) missing.push("Meta access token");
  if (!present(whatsapp.businessAccountId)) missing.push("WhatsApp Business Account ID");
  if (!present(whatsapp.phoneNumberId)) missing.push("WhatsApp phone number ID");
  if (!present(whatsapp.defaultMarketingTemplateName)) missing.push("approved marketing template");
  if (!present(whatsapp.webhookVerifyToken)) missing.push("webhook verify token");

  return missing.length
    ? notReady("whatsapp", `WhatsApp readiness failed: missing ${missing.join(", ")}.`, missing)
    : ready("whatsapp");
};

export const resolvePlatformSocialReadiness = ({ settings = {}, platforms = [], env = process.env } = {}) => {
  const social = settings.social || {};
  const requestedPlatforms = platforms.length ? platforms : ["facebook", "instagram"];
  const missing = [];
  if (!present(env.PLATFORM_META_ACCESS_TOKEN)) missing.push("Meta access token");
  if (requestedPlatforms.includes("facebook") && !present(social.facebookPageId)) missing.push("Facebook Page ID");
  if (requestedPlatforms.includes("instagram") && !present(social.instagramBusinessAccountId)) {
    missing.push("Instagram Business Account ID");
  }

  return missing.length
    ? notReady("social", `Social readiness failed: missing ${missing.join(", ")}.`, missing)
    : ready("social");
};

export const resolvePlatformOutreachReadiness = ({ settings = {}, channels = [], env = process.env } = {}) => {
  const checks = [];
  if (channels.includes("email")) checks.push(resolvePlatformEmailReadiness({ settings, env }));
  if (channels.includes("whatsapp")) checks.push(resolvePlatformWhatsAppReadiness({ settings, env }));
  if (channels.includes("facebook") || channels.includes("instagram")) {
    checks.push(resolvePlatformSocialReadiness({ settings, platforms: channels, env }));
  }

  return {
    ready: checks.every((check) => check.ready),
    checks,
  };
};
```

- [ ] **Step 6: Implement settings model**

Create `backend/models/PlatformOutreachSettings.js`:

```js
import mongoose from "mongoose";

const platformOutreachSettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: "platform-outreach", unique: true },
    email: {
      senderName: { type: String, trim: true, default: "" },
      senderEmail: { type: String, trim: true, lowercase: true, default: "" },
      postalAddress: { type: String, trim: true, default: "" },
      unsubscribeBaseUrl: { type: String, trim: true, default: "" },
    },
    whatsapp: {
      businessAccountId: { type: String, trim: true, default: "" },
      phoneNumberId: { type: String, trim: true, default: "" },
      defaultMarketingTemplateName: { type: String, trim: true, default: "" },
      webhookVerifyToken: { type: String, trim: true, default: "" },
    },
    social: {
      facebookPageId: { type: String, trim: true, default: "" },
      instagramBusinessAccountId: { type: String, trim: true, default: "" },
    },
    rateLimits: {
      maxEmailPerHour: { type: Number, min: 1, default: 50 },
      maxWhatsAppPerHour: { type: Number, min: 1, default: 20 },
      maxSocialPostsPerDay: { type: Number, min: 1, default: 10 },
    },
  },
  { timestamps: true }
);

const PlatformOutreachSettings =
  mongoose.models.PlatformOutreachSettings ||
  mongoose.model("PlatformOutreachSettings", platformOutreachSettingsSchema);

export default PlatformOutreachSettings;
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `node --test backend/tests/platformOutreachCompliance.test.js backend/tests/platformOutreachProviders.test.js`

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add backend/models/PlatformOutreachSettings.js backend/utils/platformOutreachCompliance.js backend/utils/platformOutreachProviders.js backend/tests/platformOutreachCompliance.test.js backend/tests/platformOutreachProviders.test.js
git commit -m "feat: add platform outreach readiness gates"
```

---

### Task 3: Campaign, Message, Thread, Social, And Event Models

**Files:**
- Create: `backend/models/PlatformOutreachCampaign.js`
- Create: `backend/models/PlatformOutreachMessage.js`
- Create: `backend/models/PlatformOutreachThread.js`
- Create: `backend/models/PlatformSocialPost.js`
- Create: `backend/models/PlatformOutreachEventLog.js`
- Test: `backend/tests/platformOutreachModels.test.js`

- [ ] **Step 1: Write model validation tests**

Create `backend/tests/platformOutreachModels.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import PlatformOutreachCampaign from "../models/PlatformOutreachCampaign.js";
import PlatformOutreachMessage from "../models/PlatformOutreachMessage.js";
import PlatformSocialPost from "../models/PlatformSocialPost.js";

test("platform outreach campaign requires at least one channel", async () => {
  const campaign = new PlatformOutreachCampaign({
    title: "Tour operator launch",
    objective: "Invite operators to join Mazex",
    channels: [],
  });

  await assert.rejects(() => campaign.validate(), /At least one outreach channel/i);
});

test("platform outreach message supports queued outbound email", async () => {
  const message = new PlatformOutreachMessage({
    channel: "email",
    direction: "outbound",
    subject: "Grow direct safari leads",
    body: "Mazex helps tour operators modernize sales.",
    status: "queued",
  });

  await assert.doesNotReject(() => message.validate());
});

test("platform social post requires at least one platform", async () => {
  const post = new PlatformSocialPost({
    title: "Platform launch",
    platforms: [],
    caption: "Join Mazex.",
  });

  await assert.rejects(() => post.validate(), /At least one social platform/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/platformOutreachModels.test.js`

Expected: FAIL with missing model modules.

- [ ] **Step 3: Add campaign model**

Create `backend/models/PlatformOutreachCampaign.js`:

```js
import mongoose from "mongoose";

export const PLATFORM_OUTREACH_CHANNELS = ["email", "whatsapp", "facebook", "instagram"];
export const PLATFORM_OUTREACH_CAMPAIGN_STATUSES = ["draft", "scheduled", "active", "paused", "completed"];

const platformOutreachCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    objective: { type: String, required: true, trim: true },
    audienceFilters: { type: mongoose.Schema.Types.Mixed, default: {} },
    channels: [{ type: String, enum: PLATFORM_OUTREACH_CHANNELS, required: true }],
    tone: { type: String, trim: true, default: "professional, helpful, direct" },
    offer: { type: String, trim: true, default: "" },
    status: { type: String, enum: PLATFORM_OUTREACH_CAMPAIGN_STATUSES, default: "draft" },
    schedule: { type: mongoose.Schema.Types.Mixed, default: {} },
    followUpCadence: { type: [String], default: [] },
    complianceProfile: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformAdmin", default: null },
  },
  { timestamps: true }
);

platformOutreachCampaignSchema.path("channels").validate(
  (value) => Array.isArray(value) && value.length > 0,
  "At least one outreach channel is required."
);

const PlatformOutreachCampaign =
  mongoose.models.PlatformOutreachCampaign ||
  mongoose.model("PlatformOutreachCampaign", platformOutreachCampaignSchema);

export default PlatformOutreachCampaign;
```

- [ ] **Step 4: Add message, thread, social, and event models**

Create `backend/models/PlatformOutreachMessage.js`, `backend/models/PlatformOutreachThread.js`, `backend/models/PlatformSocialPost.js`, and `backend/models/PlatformOutreachEventLog.js` using these schemas:

```js
// backend/models/PlatformOutreachMessage.js
import mongoose from "mongoose";

const platformOutreachMessageSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformOutreachCampaign", default: null, index: true },
    prospectId: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformOutreachProspect", default: null, index: true },
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformOutreachThread", default: null, index: true },
    channel: { type: String, enum: ["email", "whatsapp"], required: true, index: true },
    direction: { type: String, enum: ["outbound", "inbound"], required: true },
    subject: { type: String, trim: true, default: "" },
    body: { type: String, required: true, trim: true },
    llmGenerationMeta: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["draft", "queued", "sent", "delivered", "failed", "replied", "opted_out", "escalated"], default: "draft", index: true },
    providerMessageId: { type: String, trim: true, default: "" },
    providerError: { type: String, trim: true, default: "" },
    scheduledFor: { type: Date, default: null, index: true },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const PlatformOutreachMessage =
  mongoose.models.PlatformOutreachMessage ||
  mongoose.model("PlatformOutreachMessage", platformOutreachMessageSchema);

export default PlatformOutreachMessage;
```

```js
// backend/models/PlatformOutreachThread.js
import mongoose from "mongoose";

const platformOutreachThreadSchema = new mongoose.Schema(
  {
    prospectId: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformOutreachProspect", required: true, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformOutreachCampaign", default: null, index: true },
    channel: { type: String, enum: ["email", "whatsapp"], required: true },
    participantAddress: { type: String, trim: true, required: true },
    status: { type: String, enum: ["open", "qualified", "needs_review", "closed", "opted_out"], default: "open" },
    lastMessageAt: { type: Date, default: null },
    messages: { type: [mongoose.Schema.Types.Mixed], default: [] },
    agentState: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

platformOutreachThreadSchema.index({ prospectId: 1, channel: 1 }, { unique: false });

const PlatformOutreachThread =
  mongoose.models.PlatformOutreachThread ||
  mongoose.model("PlatformOutreachThread", platformOutreachThreadSchema);

export default PlatformOutreachThread;
```

```js
// backend/models/PlatformSocialPost.js
import mongoose from "mongoose";

const platformSocialPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    platforms: [{ type: String, enum: ["facebook", "instagram"], required: true }],
    caption: { type: String, required: true, trim: true },
    hashtags: { type: [String], default: [] },
    imageUrls: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "scheduled", "published", "failed"], default: "draft" },
    scheduledFor: { type: Date, default: null, index: true },
    publishResult: { type: mongoose.Schema.Types.Mixed, default: null },
    lastError: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformAdmin", default: null },
  },
  { timestamps: true }
);

platformSocialPostSchema.path("platforms").validate(
  (value) => Array.isArray(value) && value.length > 0,
  "At least one social platform is required."
);

const PlatformSocialPost =
  mongoose.models.PlatformSocialPost ||
  mongoose.model("PlatformSocialPost", platformSocialPostSchema);

export default PlatformSocialPost;
```

```js
// backend/models/PlatformOutreachEventLog.js
import mongoose from "mongoose";

const platformOutreachEventLogSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true, trim: true, index: true },
    prospectId: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformOutreachProspect", default: null, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformOutreachCampaign", default: null, index: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformOutreachMessage", default: null, index: true },
    actorType: { type: String, enum: ["platform-admin", "system", "agent", "provider"], default: "system" },
    actorId: { type: String, trim: true, default: "" },
    summary: { type: String, trim: true, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const PlatformOutreachEventLog =
  mongoose.models.PlatformOutreachEventLog ||
  mongoose.model("PlatformOutreachEventLog", platformOutreachEventLogSchema);

export default PlatformOutreachEventLog;
```

- [ ] **Step 5: Run model tests**

Run: `node --test backend/tests/platformOutreachModels.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add backend/models/PlatformOutreachCampaign.js backend/models/PlatformOutreachMessage.js backend/models/PlatformOutreachThread.js backend/models/PlatformSocialPost.js backend/models/PlatformOutreachEventLog.js backend/tests/platformOutreachModels.test.js
git commit -m "feat: add platform outreach activity models"
```

---

### Task 4: LLM Generation And Guardrails

**Files:**
- Create: `backend/utils/platformOutreachGeneration.js`
- Test: `backend/tests/platformOutreachGeneration.test.js`

- [ ] **Step 1: Write generation utility tests**

Create `backend/tests/platformOutreachGeneration.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlatformOutreachPrompt,
  classifyPlatformReplyIntent,
  validateGeneratedOutreach,
} from "../utils/platformOutreachGeneration.js";

test("buildPlatformOutreachPrompt includes campaign and prospect context", () => {
  const prompt = buildPlatformOutreachPrompt({
    campaign: { title: "AI Website Launch", objective: "Book demos", tone: "professional" },
    prospect: { companyName: "Kili Tours", country: "Tanzania", website: "https://example.com" },
    channel: "email",
  });

  assert.match(prompt, /AI Website Launch/);
  assert.match(prompt, /Kili Tours/);
  assert.match(prompt, /platform brand only/i);
});

test("classifyPlatformReplyIntent escalates legal and discount requests", () => {
  assert.equal(classifyPlatformReplyIntent("Can you guarantee clients?").requiresEscalation, true);
  assert.equal(classifyPlatformReplyIntent("Can I get a custom discount?").requiresEscalation, true);
  assert.equal(classifyPlatformReplyIntent("How does the AI chatbot work?").requiresEscalation, false);
});

test("validateGeneratedOutreach rejects empty generated body", () => {
  assert.throws(() => validateGeneratedOutreach({ body: "" }), /body/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/platformOutreachGeneration.test.js`

Expected: FAIL with missing utility module.

- [ ] **Step 3: Implement guardrail utility**

Create `backend/utils/platformOutreachGeneration.js`:

```js
const ESCALATION_TERMS = [
  "guarantee",
  "legal",
  "privacy",
  "data processing",
  "discount",
  "revenue share",
  "refund",
  "spam",
  "abuse",
  "partnership terms",
];

export const buildPlatformOutreachPrompt = ({ campaign = {}, prospect = {}, channel = "email" } = {}) => `
You are the Mazex platform growth assistant.
Represent the platform brand only. Do not impersonate tenant tour operators.
Do not invent prices, guarantees, rankings, partnerships, or client results.
Use configured pricing ranges only when supplied.
Include appropriate opt-out language for commercial outreach.

Campaign:
Title: ${campaign.title || ""}
Objective: ${campaign.objective || ""}
Tone: ${campaign.tone || "professional, helpful, direct"}
Offer: ${campaign.offer || ""}

Prospect:
Company: ${prospect.companyName || ""}
Country: ${prospect.country || ""}
Website: ${prospect.website || ""}
Source: ${prospect.sourceUrl || ""}

Channel: ${channel}
Return concise JSON with subject, body, confidence, and guardrailNotes.
`.trim();

export const classifyPlatformReplyIntent = (text = "") => {
  const normalized = String(text || "").toLowerCase();
  const matchedTerm = ESCALATION_TERMS.find((term) => normalized.includes(term));

  if (matchedTerm) {
    return {
      intent: "needs-human-review",
      requiresEscalation: true,
      reason: `Matched sensitive term: ${matchedTerm}`,
      confidence: 0.9,
    };
  }

  return {
    intent: "platform-sales-question",
    requiresEscalation: false,
    reason: "",
    confidence: normalized.trim() ? 0.75 : 0.2,
  };
};

export const validateGeneratedOutreach = (payload = {}) => {
  if (!String(payload.body || "").trim()) {
    throw new Error("Generated outreach body is required.");
  }

  return {
    subject: String(payload.subject || "").trim(),
    body: String(payload.body || "").trim(),
    confidence: Number(payload.confidence || 0.7),
    guardrailNotes: Array.isArray(payload.guardrailNotes) ? payload.guardrailNotes : [],
  };
};
```

- [ ] **Step 4: Run generation tests**

Run: `node --test backend/tests/platformOutreachGeneration.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/utils/platformOutreachGeneration.js backend/tests/platformOutreachGeneration.test.js
git commit -m "feat: add platform outreach generation guardrails"
```

---

### Task 5: Platform Outreach Routes

**Files:**
- Create: `backend/routes/platformOutreachRoutes.js`
- Modify: `backend/server.js`
- Test: `backend/tests/platformOutreachRoutes.test.js`

- [ ] **Step 1: Write route import smoke test**

Create `backend/tests/platformOutreachRoutes.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";

test("platform outreach routes import cleanly", async () => {
  const module = await import("../routes/platformOutreachRoutes.js");
  assert.equal(typeof module.default, "function");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/platformOutreachRoutes.test.js`

Expected: FAIL with missing route module.

- [ ] **Step 3: Implement routes**

Create `backend/routes/platformOutreachRoutes.js` with route handlers for prospects, campaigns, generated messages, readiness, and social posts:

```js
import express from "express";
import PlatformOutreachCampaign from "../models/PlatformOutreachCampaign.js";
import PlatformOutreachMessage from "../models/PlatformOutreachMessage.js";
import PlatformOutreachProspect from "../models/PlatformOutreachProspect.js";
import PlatformOutreachSettings from "../models/PlatformOutreachSettings.js";
import PlatformSocialPost from "../models/PlatformSocialPost.js";
import { requirePlatformAdmin } from "../middleware/platformAdminAuthMiddleware.js";
import {
  buildPlatformProspectPayload,
  buildProspectDuplicateQuery,
} from "../utils/platformOutreachProspects.js";
import {
  buildPlatformOutreachPrompt,
  validateGeneratedOutreach,
} from "../utils/platformOutreachGeneration.js";
import { resolvePlatformOutreachReadiness } from "../utils/platformOutreachProviders.js";

const router = express.Router();
router.use(requirePlatformAdmin);

const getSettings = async () =>
  PlatformOutreachSettings.findOneAndUpdate(
    { singletonKey: "platform-outreach" },
    { $setOnInsert: { singletonKey: "platform-outreach" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

router.get("/settings/readiness", async (_req, res) => {
  const settings = await getSettings();
  res.status(200).json({
    readiness: resolvePlatformOutreachReadiness({
      settings,
      channels: ["email", "whatsapp", "facebook", "instagram"],
      env: process.env,
    }),
    settings,
  });
});

router.get("/prospects", async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  const prospects = await PlatformOutreachProspect.find(query).sort({ updatedAt: -1 }).limit(200).lean();
  res.status(200).json(prospects);
});

router.post("/prospects", async (req, res) => {
  const payload = buildPlatformProspectPayload(req.body);
  const duplicateQuery = buildProspectDuplicateQuery(payload);
  const prospect = await PlatformOutreachProspect.findOneAndUpdate(
    duplicateQuery,
    { $set: payload },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(prospect);
});

router.post("/prospects/import", async (req, res) => {
  const rows = Array.isArray(req.body.prospects) ? req.body.prospects : [];
  const results = [];
  for (const row of rows) {
    const payload = buildPlatformProspectPayload(row);
    const prospect = await PlatformOutreachProspect.findOneAndUpdate(
      buildProspectDuplicateQuery(payload),
      { $set: payload },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    results.push(prospect);
  }
  res.status(200).json({ importedCount: results.length, prospects: results });
});

router.patch("/prospects/:id", async (req, res) => {
  const prospect = await PlatformOutreachProspect.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!prospect) return res.status(404).json({ message: "Prospect not found." });
  res.status(200).json(prospect);
});

router.get("/campaigns", async (_req, res) => {
  const campaigns = await PlatformOutreachCampaign.find().sort({ updatedAt: -1 }).lean();
  res.status(200).json(campaigns);
});

router.post("/campaigns", async (req, res) => {
  const campaign = await PlatformOutreachCampaign.create({
    ...req.body,
    createdBy: req.platformAdmin?._id || null,
  });
  res.status(201).json(campaign);
});

router.post("/campaigns/:id/generate", async (req, res) => {
  const [campaign, prospect] = await Promise.all([
    PlatformOutreachCampaign.findById(req.params.id).lean(),
    PlatformOutreachProspect.findById(req.body.prospectId).lean(),
  ]);
  if (!campaign) return res.status(404).json({ message: "Campaign not found." });
  if (!prospect) return res.status(404).json({ message: "Prospect not found." });

  const prompt = buildPlatformOutreachPrompt({
    campaign,
    prospect,
    channel: req.body.channel || "email",
  });
  const generated = validateGeneratedOutreach({
    subject: `${campaign.title} for ${prospect.companyName}`,
    body: `Hello ${prospect.companyName}, Mazex helps tour companies modernize websites, AI lead capture, social content, and follow-up workflows. Reply if you want a short demo.`,
    confidence: 0.7,
    guardrailNotes: ["deterministic-initial-draft"],
  });

  const message = await PlatformOutreachMessage.create({
    campaignId: campaign._id,
    prospectId: prospect._id,
    channel: req.body.channel || "email",
    direction: "outbound",
    subject: generated.subject,
    body: generated.body,
    status: "draft",
    llmGenerationMeta: {
      prompt,
      confidence: generated.confidence,
      guardrailNotes: generated.guardrailNotes,
    },
  });

  res.status(201).json({ message, prompt });
});

router.post("/campaigns/:id/launch", async (req, res) => {
  const campaign = await PlatformOutreachCampaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found." });
  const settings = await getSettings();
  const readiness = resolvePlatformOutreachReadiness({
    settings,
    channels: campaign.channels,
    env: process.env,
  });
  if (!readiness.ready) return res.status(400).json({ message: "Provider readiness failed.", readiness });
  campaign.status = "active";
  await campaign.save();
  res.status(200).json({ campaign, readiness });
});

router.get("/messages", async (_req, res) => {
  const messages = await PlatformOutreachMessage.find().sort({ updatedAt: -1 }).limit(200).lean();
  res.status(200).json(messages);
});

router.get("/social-posts", async (_req, res) => {
  const posts = await PlatformSocialPost.find().sort({ scheduledFor: 1, updatedAt: -1 }).lean();
  res.status(200).json(posts);
});

router.post("/social-posts", async (req, res) => {
  const post = await PlatformSocialPost.create({
    ...req.body,
    createdBy: req.platformAdmin?._id || null,
  });
  res.status(201).json(post);
});

router.patch("/social-posts/:id", async (req, res) => {
  const post = await PlatformSocialPost.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!post) return res.status(404).json({ message: "Social post not found." });
  res.status(200).json(post);
});

export default router;
```

- [ ] **Step 4: Mount routes in server**

Modify `backend/server.js`:

```js
import platformOutreachRoutes from "./routes/platformOutreachRoutes.js";
```

Add after the existing `/api/platform-admin` mount:

```js
app.use("/api/platform-admin/outreach", platformOutreachRoutes);
```

- [ ] **Step 5: Run route smoke test**

Run: `node --test backend/tests/platformOutreachRoutes.test.js`

Expected: PASS.

- [ ] **Step 6: Run server import smoke**

Run:

```bash
node -e "import('./backend/server.js').then(() => { console.log('server-import-ok'); process.exit(0); }).catch((error) => { console.error(error); process.exit(1); })"
```

Expected: prints `server-import-ok`.

- [ ] **Step 7: Commit**

Run:

```bash
git add backend/routes/platformOutreachRoutes.js backend/server.js backend/tests/platformOutreachRoutes.test.js
git commit -m "feat: add platform outreach admin routes"
```

---

### Task 6: Queue Processor And Provider Adapter Skeleton

**Files:**
- Create: `backend/utils/platformOutreachQueue.js`
- Create: `backend/utils/platformOutreachProcessor.js`
- Test: `backend/tests/platformOutreachProcessor.test.js`

- [ ] **Step 1: Write processor unit tests**

Create `backend/tests/platformOutreachProcessor.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlatformOutreachDispatchJob,
  processPlatformOutreachMessage,
} from "../utils/platformOutreachProcessor.js";

test("buildPlatformOutreachDispatchJob serializes message and channel", () => {
  assert.deepEqual(
    buildPlatformOutreachDispatchJob({ messageId: "msg1", channel: "email" }),
    { messageId: "msg1", channel: "email", jobType: "platform-outreach-message" }
  );
});

test("processPlatformOutreachMessage marks mocked send as sent", async () => {
  const message = {
    _id: "msg1",
    channel: "email",
    status: "queued",
    save: async function save() {
      return this;
    },
  };

  const result = await processPlatformOutreachMessage({
    message,
    prospect: { emailOptOut: false },
    settings: {
      email: {
        senderEmail: "sales@mazex.com",
        senderName: "Mazex",
        postalAddress: "123 Market Street",
        unsubscribeBaseUrl: "https://mazex.example/unsubscribe",
      },
    },
    env: { PLATFORM_EMAIL_API_KEY: "key" },
    providerClient: {
      sendEmail: async () => ({ providerMessageId: "provider-1" }),
    },
  });

  assert.equal(result.status, "sent");
  assert.equal(message.status, "sent");
  assert.equal(message.providerMessageId, "provider-1");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/platformOutreachProcessor.test.js`

Expected: FAIL with missing processor module.

- [ ] **Step 3: Implement processor**

Create `backend/utils/platformOutreachProcessor.js`:

```js
import { assertCanSendPlatformMessage } from "./platformOutreachCompliance.js";
import {
  resolvePlatformEmailReadiness,
  resolvePlatformWhatsAppReadiness,
} from "./platformOutreachProviders.js";

export const buildPlatformOutreachDispatchJob = ({ messageId, channel }) => ({
  messageId: String(messageId),
  channel,
  jobType: "platform-outreach-message",
});

const assertReadiness = ({ channel, settings, env }) => {
  const readiness =
    channel === "email"
      ? resolvePlatformEmailReadiness({ settings, env })
      : resolvePlatformWhatsAppReadiness({ settings, env });

  if (!readiness.ready) {
    throw new Error(readiness.message);
  }
};

export const processPlatformOutreachMessage = async ({
  message,
  prospect,
  settings,
  env = process.env,
  providerClient,
} = {}) => {
  assertCanSendPlatformMessage({ channel: message.channel, prospect });
  assertReadiness({ channel: message.channel, settings, env });

  const sendResult =
    message.channel === "email"
      ? await providerClient.sendEmail({ message, prospect, settings })
      : await providerClient.sendWhatsApp({ message, prospect, settings });

  message.status = "sent";
  message.providerMessageId = sendResult.providerMessageId || "";
  message.providerError = "";
  message.sentAt = new Date();
  await message.save();

  return {
    status: "sent",
    providerMessageId: message.providerMessageId,
  };
};
```

- [ ] **Step 4: Add queue helper**

Create `backend/utils/platformOutreachQueue.js`:

```js
const QUEUE_KEY = "platform-outreach:dispatch";
const DEDUPE_PREFIX = "platform-outreach:dispatch:";

export const buildPlatformOutreachQueueKey = () => QUEUE_KEY;

export const buildPlatformOutreachDedupeKey = (job = {}) =>
  `${DEDUPE_PREFIX}${job.jobType}:${job.messageId}`;

export const enqueuePlatformOutreachJob = async ({ redisClient, job } = {}) => {
  await redisClient.rPush(QUEUE_KEY, JSON.stringify(job));
  return true;
};

export const markPlatformOutreachQueued = async ({ redisClient, job, ttlSeconds = 900 } = {}) => {
  const key = buildPlatformOutreachDedupeKey(job);
  const result = await redisClient.set(key, "1", { NX: true, EX: ttlSeconds });
  return result === "OK";
};
```

- [ ] **Step 5: Run processor test**

Run: `node --test backend/tests/platformOutreachProcessor.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add backend/utils/platformOutreachQueue.js backend/utils/platformOutreachProcessor.js backend/tests/platformOutreachProcessor.test.js
git commit -m "feat: add platform outreach queue processor"
```

---

### Task 7: Live Provider Adapter Functions

**Files:**
- Modify: `backend/utils/platformOutreachProviders.js`
- Test: `backend/tests/platformOutreachProviders.test.js`

- [ ] **Step 1: Extend provider tests for live adapter request shapes**

Append to `backend/tests/platformOutreachProviders.test.js`:

```js
import {
  publishPlatformSocialPost,
  sendPlatformEmail,
  sendPlatformWhatsAppTemplate,
} from "../utils/platformOutreachProviders.js";

test("sendPlatformEmail posts to configured email endpoint", async () => {
  const calls = [];
  const result = await sendPlatformEmail({
    message: { subject: "Hello", body: "Body" },
    prospect: { email: "sales@example.com" },
    settings: {
      email: {
        senderEmail: "sales@mazex.com",
        senderName: "Mazex",
        unsubscribeBaseUrl: "https://mazex.example/unsubscribe",
      },
    },
    env: {
      PLATFORM_EMAIL_API_KEY: "key",
      PLATFORM_EMAIL_SEND_ENDPOINT: "https://email.example/send",
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ id: "email-1" }) };
    },
  });

  assert.equal(result.providerMessageId, "email-1");
  assert.equal(calls[0].url, "https://email.example/send");
  assert.match(calls[0].options.body, /sales@example.com/);
});

test("sendPlatformWhatsAppTemplate posts to Graph API phone endpoint", async () => {
  const calls = [];
  const result = await sendPlatformWhatsAppTemplate({
    message: { body: "Hello from Mazex" },
    prospect: { whatsappNumber: "+255700111222" },
    settings: { whatsapp: { phoneNumberId: "phone-1", defaultMarketingTemplateName: "mazex_intro" } },
    env: { PLATFORM_WHATSAPP_ACCESS_TOKEN: "token" },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ messages: [{ id: "wa-1" }] }) };
    },
  });

  assert.equal(result.providerMessageId, "wa-1");
  assert.match(calls[0].url, /phone-1\/messages/);
});

test("publishPlatformSocialPost posts to Graph API page feed for Facebook", async () => {
  const calls = [];
  const result = await publishPlatformSocialPost({
    post: { platforms: ["facebook"], caption: "Join Mazex" },
    settings: { social: { facebookPageId: "page-1" } },
    env: { PLATFORM_META_ACCESS_TOKEN: "token" },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ id: "fb-1" }) };
    },
  });

  assert.equal(result.facebook.id, "fb-1");
  assert.match(calls[0].url, /page-1\/feed/);
});
```

- [ ] **Step 2: Run provider tests to verify they fail**

Run: `node --test backend/tests/platformOutreachProviders.test.js`

Expected: FAIL because adapter functions are not exported.

- [ ] **Step 3: Add provider adapter functions**

Append to `backend/utils/platformOutreachProviders.js`:

```js
const parseProviderResponse = async (response, label) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${label} provider rejected the request: ${payload.error?.message || response.status}`);
  }
  return payload;
};

export const sendPlatformEmail = async ({
  message,
  prospect,
  settings,
  env = process.env,
  fetchImpl = fetch,
} = {}) => {
  const endpoint = env.PLATFORM_EMAIL_SEND_ENDPOINT || "https://api.resend.com/emails";
  const payload = {
    from: `${settings.email.senderName} <${settings.email.senderEmail}>`,
    to: [prospect.email],
    subject: message.subject,
    html: `${message.body}<p><a href="${settings.email.unsubscribeBaseUrl}?email=${encodeURIComponent(prospect.email)}">Unsubscribe</a></p>`,
  };

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PLATFORM_EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const parsed = await parseProviderResponse(response, "Email");
  return { providerMessageId: parsed.id || parsed.messageId || "" };
};

export const sendPlatformWhatsAppTemplate = async ({
  message,
  prospect,
  settings,
  env = process.env,
  fetchImpl = fetch,
} = {}) => {
  const url = `https://graph.facebook.com/v21.0/${settings.whatsapp.phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: prospect.whatsappNumber.replace(/^\+/, ""),
    type: "template",
    template: {
      name: settings.whatsapp.defaultMarketingTemplateName,
      language: { code: settings.whatsapp.templateLanguage || "en" },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: message.body }],
        },
      ],
    },
  };

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PLATFORM_WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const parsed = await parseProviderResponse(response, "WhatsApp");
  return { providerMessageId: parsed.messages?.[0]?.id || "" };
};

export const publishPlatformSocialPost = async ({
  post,
  settings,
  env = process.env,
  fetchImpl = fetch,
} = {}) => {
  const result = {};

  if ((post.platforms || []).includes("facebook")) {
    const url = `https://graph.facebook.com/v21.0/${settings.social.facebookPageId}/feed`;
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: post.caption,
        access_token: env.PLATFORM_META_ACCESS_TOKEN,
      }),
    });
    result.facebook = await parseProviderResponse(response, "Facebook");
  }

  if ((post.platforms || []).includes("instagram")) {
    const url = `https://graph.facebook.com/v21.0/${settings.social.instagramBusinessAccountId}/media`;
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: post.caption,
        image_url: post.imageUrls?.[0] || "",
        access_token: env.PLATFORM_META_ACCESS_TOKEN,
      }),
    });
    result.instagram = await parseProviderResponse(response, "Instagram");
  }

  return result;
};
```

- [ ] **Step 4: Wire processor to default live adapters**

Modify `backend/utils/platformOutreachProcessor.js` imports:

```js
import {
  resolvePlatformEmailReadiness,
  resolvePlatformWhatsAppReadiness,
  sendPlatformEmail,
  sendPlatformWhatsAppTemplate,
} from "./platformOutreachProviders.js";
```

Change the send selection:

```js
  const liveProviderClient = providerClient || {
    sendEmail: sendPlatformEmail,
    sendWhatsApp: sendPlatformWhatsAppTemplate,
  };

  const sendResult =
    message.channel === "email"
      ? await liveProviderClient.sendEmail({ message, prospect, settings, env })
      : await liveProviderClient.sendWhatsApp({ message, prospect, settings, env });
```

- [ ] **Step 5: Run provider and processor tests**

Run: `node --test backend/tests/platformOutreachProviders.test.js backend/tests/platformOutreachProcessor.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add backend/utils/platformOutreachProviders.js backend/utils/platformOutreachProcessor.js backend/tests/platformOutreachProviders.test.js
git commit -m "feat: add live platform outreach provider adapters"
```

---

### Task 8: Frontend API Helpers And Navigation

**Files:**
- Modify: `src/services/api.js`
- Modify: `src/pages/platformAdminNavigation.js`
- Test: `src/pages/platformAdminNavigation.test.js`

- [ ] **Step 1: Write navigation test**

Modify `src/pages/platformAdminNavigation.test.js` to include:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { platformPrimarySections } from "./platformAdminNavigation.js";

test("platform admin navigation includes growth outreach", () => {
  assert.equal(
    platformPrimarySections.some((section) => section.id === "growth-outreach"),
    true
  );
});
```

- [ ] **Step 2: Run navigation test to verify it fails**

Run: `node --test src/pages/platformAdminNavigation.test.js`

Expected: FAIL because `growth-outreach` is not present.

- [ ] **Step 3: Add API helpers**

Modify `src/services/api.js` near other platform admin helpers:

```js
export const fetchPlatformOutreachReadiness = () =>
  cachedGet("/platform-admin/outreach/settings/readiness", {
    headers: getPlatformAdminHeaders(),
  });

export const fetchPlatformOutreachProspects = (params = {}) =>
  API.get("/platform-admin/outreach/prospects", {
    params,
    headers: getPlatformAdminHeaders(),
  });

export const createPlatformOutreachProspect = (data) =>
  API.post("/platform-admin/outreach/prospects", data, {
    headers: getPlatformAdminHeaders(),
  });

export const importPlatformOutreachProspects = (prospects) =>
  API.post("/platform-admin/outreach/prospects/import", { prospects }, {
    headers: getPlatformAdminHeaders(),
  });

export const fetchPlatformOutreachCampaigns = () =>
  API.get("/platform-admin/outreach/campaigns", {
    headers: getPlatformAdminHeaders(),
  });

export const createPlatformOutreachCampaign = (data) =>
  API.post("/platform-admin/outreach/campaigns", data, {
    headers: getPlatformAdminHeaders(),
  });

export const generatePlatformOutreachMessage = (campaignId, data) =>
  API.post(`/platform-admin/outreach/campaigns/${campaignId}/generate`, data, {
    headers: getPlatformAdminHeaders(),
  });

export const launchPlatformOutreachCampaign = (campaignId) =>
  API.post(`/platform-admin/outreach/campaigns/${campaignId}/launch`, {}, {
    headers: getPlatformAdminHeaders(),
  });

export const fetchPlatformOutreachMessages = () =>
  API.get("/platform-admin/outreach/messages", {
    headers: getPlatformAdminHeaders(),
  });

export const fetchPlatformSocialPosts = () =>
  API.get("/platform-admin/outreach/social-posts", {
    headers: getPlatformAdminHeaders(),
  });

export const createPlatformSocialPost = (data) =>
  API.post("/platform-admin/outreach/social-posts", data, {
    headers: getPlatformAdminHeaders(),
  });
```

- [ ] **Step 4: Add navigation item**

Modify `src/pages/platformAdminNavigation.js`:

```js
export const platformPrimarySections = [
  { id: "tenants", label: "Tenant Home" },
  { id: "create", label: "Create Tenant" },
  { id: "template-studio", label: "Template Studio" },
  { id: "growth-outreach", label: "Growth Outreach" },
];
```

- [ ] **Step 5: Run navigation test**

Run: `node --test src/pages/platformAdminNavigation.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/services/api.js src/pages/platformAdminNavigation.js src/pages/platformAdminNavigation.test.js
git commit -m "feat: expose platform outreach client APIs"
```

---

### Task 9: Platform Admin Growth Outreach UI

**Files:**
- Create: `src/components/PlatformAdmin/GrowthOutreachManager.jsx`
- Modify: `src/pages/PlatformAdminDashboard.jsx`

- [ ] **Step 1: Create UI component**

Create `src/components/PlatformAdmin/GrowthOutreachManager.jsx`:

```jsx
import { useEffect, useState } from "react";
import {
  createPlatformOutreachCampaign,
  createPlatformOutreachProspect,
  createPlatformSocialPost,
  fetchPlatformOutreachCampaigns,
  fetchPlatformOutreachMessages,
  fetchPlatformOutreachProspects,
  fetchPlatformOutreachReadiness,
  fetchPlatformSocialPosts,
  generatePlatformOutreachMessage,
  launchPlatformOutreachCampaign,
} from "../../services/api";

const panelClass = "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm";
const inputClass = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-950";

const GrowthOutreachManager = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [readiness, setReadiness] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [messages, setMessages] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [prospectForm, setProspectForm] = useState({ companyName: "", email: "", whatsappNumber: "", website: "", country: "", sourceUrl: "", tags: "" });
  const [campaignForm, setCampaignForm] = useState({ title: "", objective: "", channels: ["email"], offer: "" });
  const [socialForm, setSocialForm] = useState({ title: "", platforms: ["facebook", "instagram"], caption: "", hashtags: "", scheduledFor: "" });
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [readinessResponse, prospectResponse, campaignResponse, messageResponse, socialResponse] = await Promise.all([
        fetchPlatformOutreachReadiness(),
        fetchPlatformOutreachProspects(),
        fetchPlatformOutreachCampaigns(),
        fetchPlatformOutreachMessages(),
        fetchPlatformSocialPosts(),
      ]);
      setReadiness(readinessResponse.data?.readiness || null);
      setProspects(Array.isArray(prospectResponse.data) ? prospectResponse.data : []);
      setCampaigns(Array.isArray(campaignResponse.data) ? campaignResponse.data : []);
      setMessages(Array.isArray(messageResponse.data) ? messageResponse.data : []);
      setSocialPosts(Array.isArray(socialResponse.data) ? socialResponse.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load platform outreach data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProspect = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await createPlatformOutreachProspect(prospectForm);
      setProspectForm({ companyName: "", email: "", whatsappNumber: "", website: "", country: "", sourceUrl: "", tags: "" });
      setNotice("Prospect saved.");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save prospect.");
    }
  };

  const handleCreateCampaign = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await createPlatformOutreachCampaign(campaignForm);
      setCampaignForm({ title: "", objective: "", channels: ["email"], offer: "" });
      setNotice("Campaign saved.");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save campaign.");
    }
  };

  const handleGenerateMessage = async () => {
    if (!selectedCampaignId || !selectedProspectId) {
      setError("Choose a campaign and prospect before generating outreach.");
      return;
    }
    setError("");
    setNotice("");
    try {
      await generatePlatformOutreachMessage(selectedCampaignId, { prospectId: selectedProspectId, channel: "email" });
      setNotice("Outreach draft generated.");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate outreach.");
    }
  };

  const handleLaunchCampaign = async () => {
    if (!selectedCampaignId) {
      setError("Choose a campaign before launching.");
      return;
    }
    setError("");
    setNotice("");
    try {
      await launchPlatformOutreachCampaign(selectedCampaignId);
      setNotice("Campaign launched.");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Campaign readiness failed.");
    }
  };

  const handleCreateSocialPost = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await createPlatformSocialPost({
        ...socialForm,
        hashtags: socialForm.hashtags.split(/[,\n]/).map((tag) => tag.trim()).filter(Boolean),
        status: socialForm.scheduledFor ? "scheduled" : "draft",
      });
      setSocialForm({ title: "", platforms: ["facebook", "instagram"], caption: "", hashtags: "", scheduledFor: "" });
      setNotice("Social post saved.");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save social post.");
    }
  };

  const tabs = ["overview", "prospects", "campaigns", "messages", "social"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Platform Growth</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">Growth Outreach</h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500">
            Import public-source tour-company prospects, generate platform-branded outreach, launch live campaigns when provider readiness passes, and track replies.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest ${activeTab === tab ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white text-zinc-600"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</div>}
      {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{notice}</div>}
      {loading && <div className={panelClass}>Loading outreach workspace...</div>}

      {!loading && activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[["Prospects", prospects.length], ["Campaigns", campaigns.length], ["Messages", messages.length], ["Social Posts", socialPosts.length]].map(([label, value]) => (
            <div key={label} className={panelClass}>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
              <p className="mt-3 text-3xl font-black text-zinc-950">{value}</p>
            </div>
          ))}
          <div className="md:col-span-4 rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Provider Readiness</p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {(readiness?.checks || []).map((check) => (
                <div key={check.channel} className={`rounded-xl border px-4 py-4 ${check.ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                  <p className="font-black capitalize text-zinc-950">{check.channel}</p>
                  <p className="mt-2 text-sm font-medium text-zinc-600">{check.ready ? "Ready" : check.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "prospects" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={handleCreateProspect} className={panelClass}>
            <h3 className="text-xl font-black text-zinc-950">Add Prospect</h3>
            <div className="mt-5 space-y-3">
              {["companyName", "email", "whatsappNumber", "website", "country", "sourceUrl", "tags"].map((field) => (
                <input key={field} className={inputClass} value={prospectForm[field]} onChange={(event) => setProspectForm((current) => ({ ...current, [field]: event.target.value }))} placeholder={field} required={field === "companyName" || field === "sourceUrl"} />
              ))}
              <button className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white">Save Prospect</button>
            </div>
          </form>
          <div className={panelClass}>
            <h3 className="text-xl font-black text-zinc-950">Prospects</h3>
            <div className="mt-5 space-y-3">
              {prospects.map((prospect) => (
                <div key={prospect._id} className="rounded-xl bg-zinc-50 p-4">
                  <p className="font-black text-zinc-950">{prospect.companyName}</p>
                  <p className="mt-1 text-xs font-bold text-zinc-500">{prospect.email || prospect.whatsappNumber}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "campaigns" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={handleCreateCampaign} className={panelClass}>
            <h3 className="text-xl font-black text-zinc-950">Create Campaign</h3>
            <div className="mt-5 space-y-3">
              <input className={inputClass} value={campaignForm.title} onChange={(event) => setCampaignForm((current) => ({ ...current, title: event.target.value }))} placeholder="Campaign title" required />
              <textarea className={inputClass} value={campaignForm.objective} onChange={(event) => setCampaignForm((current) => ({ ...current, objective: event.target.value }))} placeholder="Objective" required />
              <input className={inputClass} value={campaignForm.offer} onChange={(event) => setCampaignForm((current) => ({ ...current, offer: event.target.value }))} placeholder="Offer" />
              <button className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white">Save Campaign</button>
            </div>
          </form>
          <div className={panelClass}>
            <h3 className="text-xl font-black text-zinc-950">Generate And Launch</h3>
            <div className="mt-5 space-y-3">
              <select className={inputClass} value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)}>
                <option value="">Choose campaign</option>
                {campaigns.map((campaign) => <option key={campaign._id} value={campaign._id}>{campaign.title}</option>)}
              </select>
              <select className={inputClass} value={selectedProspectId} onChange={(event) => setSelectedProspectId(event.target.value)}>
                <option value="">Choose prospect</option>
                {prospects.map((prospect) => <option key={prospect._id} value={prospect._id}>{prospect.companyName}</option>)}
              </select>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleGenerateMessage} className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-black uppercase tracking-widest text-zinc-700">Generate Draft</button>
                <button type="button" onClick={handleLaunchCampaign} className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white">Launch</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "messages" && (
        <div className={panelClass}>
          <h3 className="text-xl font-black text-zinc-950">Messages</h3>
          <div className="mt-5 space-y-3">
            {messages.map((message) => (
              <div key={message._id} className="rounded-xl bg-zinc-50 p-4">
                <p className="font-black text-zinc-950">{message.subject || message.channel}</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-zinc-500">{message.body}</p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">{message.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && activeTab === "social" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={handleCreateSocialPost} className={panelClass}>
            <h3 className="text-xl font-black text-zinc-950">Schedule Social Post</h3>
            <div className="mt-5 space-y-3">
              <input className={inputClass} value={socialForm.title} onChange={(event) => setSocialForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" required />
              <textarea className={inputClass} value={socialForm.caption} onChange={(event) => setSocialForm((current) => ({ ...current, caption: event.target.value }))} placeholder="Caption" required />
              <input className={inputClass} value={socialForm.hashtags} onChange={(event) => setSocialForm((current) => ({ ...current, hashtags: event.target.value }))} placeholder="#mazex, #tourismtech" />
              <input className={inputClass} type="datetime-local" value={socialForm.scheduledFor} onChange={(event) => setSocialForm((current) => ({ ...current, scheduledFor: event.target.value }))} />
              <button className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white">Save Social Post</button>
            </div>
          </form>
          <div className={panelClass}>
            <h3 className="text-xl font-black text-zinc-950">Scheduled Platform Posts</h3>
            <div className="mt-5 space-y-3">
              {socialPosts.map((post) => (
                <div key={post._id} className="rounded-xl bg-zinc-50 p-4">
                  <p className="font-black text-zinc-950">{post.title}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">{post.caption}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">{post.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthOutreachManager;
```

- [ ] **Step 2: Wire component into platform dashboard**

Modify `src/pages/PlatformAdminDashboard.jsx`:

```jsx
import GrowthOutreachManager from "../components/PlatformAdmin/GrowthOutreachManager";
```

Add to `headerMeta`:

```js
"growth-outreach": {
  eyebrow: "Platform Growth",
  title: "Growth Outreach",
  description: "Market the Mazex platform to tour companies with provider-ready email, WhatsApp, and social outreach.",
},
```

Add before the tenant section render:

```jsx
{activeSection === "growth-outreach" && <GrowthOutreachManager />}
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS with Vite build and prerender output.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/components/PlatformAdmin/GrowthOutreachManager.jsx src/pages/PlatformAdminDashboard.jsx
git commit -m "feat: add platform growth outreach UI"
```

---

### Task 10: Event Logging And Autonomous Reply Route

**Files:**
- Create: `backend/utils/platformOutreachEvents.js`
- Modify: `backend/routes/platformOutreachRoutes.js`
- Test: `backend/tests/platformOutreachEvents.test.js`

- [ ] **Step 1: Write event utility test**

Create `backend/tests/platformOutreachEvents.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildPlatformOutreachEventPayload } from "../utils/platformOutreachEvents.js";

test("buildPlatformOutreachEventPayload creates audit-safe metadata", () => {
  const event = buildPlatformOutreachEventPayload({
    eventType: "auto-reply-sent",
    actorType: "agent",
    summary: "Answered pricing question.",
    metadata: { prompt: "secret prompt", confidence: 0.82 },
  });

  assert.equal(event.eventType, "auto-reply-sent");
  assert.equal(event.actorType, "agent");
  assert.equal(event.metadata.confidence, 0.82);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/platformOutreachEvents.test.js`

Expected: FAIL with missing utility module.

- [ ] **Step 3: Implement event utility**

Create `backend/utils/platformOutreachEvents.js`:

```js
export const buildPlatformOutreachEventPayload = ({
  eventType,
  prospectId = null,
  campaignId = null,
  messageId = null,
  actorType = "system",
  actorId = "",
  summary = "",
  metadata = {},
} = {}) => ({
  eventType,
  prospectId,
  campaignId,
  messageId,
  actorType,
  actorId: String(actorId || ""),
  summary: String(summary || "").trim(),
  metadata,
});
```

- [ ] **Step 4: Add event writes and autonomous reply endpoint**

Modify `backend/routes/platformOutreachRoutes.js` imports:

```js
import PlatformOutreachEventLog from "../models/PlatformOutreachEventLog.js";
import PlatformOutreachThread from "../models/PlatformOutreachThread.js";
import { assertCanSendPlatformMessage } from "../utils/platformOutreachCompliance.js";
import { buildPlatformOutreachEventPayload } from "../utils/platformOutreachEvents.js";
import { classifyPlatformReplyIntent } from "../utils/platformOutreachGeneration.js";
```

After prospect creation, campaign generation, and campaign launch, call:

```js
await PlatformOutreachEventLog.create(
  buildPlatformOutreachEventPayload({
    eventType: "prospect-upserted",
    prospectId: prospect._id,
    actorType: "platform-admin",
    actorId: req.platformAdmin?._id,
    summary: `Prospect ${prospect.companyName} saved.`,
  })
);
```

Add thread list and agent reply routes:

```js
router.get("/threads", async (_req, res) => {
  const threads = await PlatformOutreachThread.find().sort({ lastMessageAt: -1, updatedAt: -1 }).limit(200).lean();
  res.status(200).json(threads);
});

router.post("/threads/:id/agent-reply", async (req, res) => {
  const thread = await PlatformOutreachThread.findById(req.params.id);
  if (!thread) return res.status(404).json({ message: "Thread not found." });

  const prospect = await PlatformOutreachProspect.findById(thread.prospectId).lean();
  if (!prospect) return res.status(404).json({ message: "Prospect not found." });

  const latestText = req.body.text || thread.messages?.at(-1)?.body || "";
  const decision = classifyPlatformReplyIntent(latestText);

  if (decision.requiresEscalation || decision.confidence < 0.65) {
    thread.status = "needs_review";
    thread.agentState = { decision };
    await thread.save();
    await PlatformOutreachEventLog.create(
      buildPlatformOutreachEventPayload({
        eventType: "agent-reply-escalated",
        prospectId: prospect._id,
        campaignId: thread.campaignId,
        actorType: "agent",
        summary: decision.reason || "Low confidence reply decision.",
        metadata: { decision },
      })
    );
    return res.status(202).json({ thread, decision });
  }

  assertCanSendPlatformMessage({ channel: thread.channel, prospect });

  const reply = await PlatformOutreachMessage.create({
    campaignId: thread.campaignId,
    prospectId: prospect._id,
    threadId: thread._id,
    channel: thread.channel,
    direction: "outbound",
    subject: "Re: Mazex platform",
    body: "Thanks for your reply. Mazex helps tour companies launch modern websites, capture AI-qualified leads, and manage social, email, and WhatsApp follow-up from one platform. I can help you choose the right setup or book a short demo.",
    status: "queued",
    llmGenerationMeta: { decision, source: "bounded-platform-sales-agent" },
  });

  thread.status = "open";
  thread.lastMessageAt = new Date();
  thread.messages = [
    ...(thread.messages || []),
    { direction: "outbound", body: reply.body, messageId: String(reply._id), createdAt: new Date() },
  ];
  thread.agentState = { decision };
  await thread.save();

  await PlatformOutreachEventLog.create(
    buildPlatformOutreachEventPayload({
      eventType: "agent-reply-queued",
      prospectId: prospect._id,
      campaignId: thread.campaignId,
      messageId: reply._id,
      actorType: "agent",
      summary: "Autonomous platform-sales reply queued.",
      metadata: { decision },
    })
  );

  res.status(201).json({ thread, reply, decision });
});
```

- [ ] **Step 5: Run event and route tests**

Run: `node --test backend/tests/platformOutreachEvents.test.js backend/tests/platformOutreachRoutes.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add backend/utils/platformOutreachEvents.js backend/routes/platformOutreachRoutes.js backend/tests/platformOutreachEvents.test.js
git commit -m "feat: add platform outreach audit and agent replies"
```

---

## Final Verification

- [ ] Run backend tests:

```bash
node --test backend/tests/platformOutreachProspects.test.js backend/tests/platformOutreachCompliance.test.js backend/tests/platformOutreachProviders.test.js backend/tests/platformOutreachModels.test.js backend/tests/platformOutreachGeneration.test.js backend/tests/platformOutreachRoutes.test.js backend/tests/platformOutreachProcessor.test.js backend/tests/platformOutreachEvents.test.js
```

Expected: PASS.

- [ ] Run frontend/navigation test:

```bash
node --test src/pages/platformAdminNavigation.test.js
```

Expected: PASS.

- [ ] Run full build:

```bash
npm run build
```

Expected: PASS.

- [ ] Confirm unrelated untracked files remain untouched:

```bash
git status --short
```

Expected: only intentional implementation files are modified or staged; `www.aura.build_browse_components.png` may remain untracked and should not be staged.

## Spec Coverage Review

- Prospect CRM: Tasks 1, 5, and 8.
- Campaign Builder: Tasks 3, 5, and 8.
- LLM Content Engine: Task 4 and route generation in Task 5.
- Live provider readiness: Task 2 and launch gate in Task 5.
- Queue and scheduling: Task 6.
- Autonomous reply guardrails: Tasks 4 and 10.
- Social scheduler: Tasks 3, 5, 7, and 9.
- Audit logging: Tasks 3 and 10.
