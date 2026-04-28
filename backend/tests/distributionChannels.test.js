import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDistributionLinkSet,
  buildPlannerEmbedSnippet,
  buildPublicDistributionBootstrap,
} from "../utils/distributionChannels.js";

test("buildDistributionLinkSet creates hosted and embed links with attribution", () => {
  const links = buildDistributionLinkSet({
    baseUrl: "https://mazexpeditions.com/",
    tenantSlug: "maz-expeditions",
    referralCode: "PARTNER42",
    campaignLabel: "april-promo",
  });

  assert.equal(
    links.hostedPlannerUrl,
    "https://mazexpeditions.com/plan-my-trip?source=hosted-social&campaign=april-promo&referral=PARTNER42"
  );
  assert.equal(
    links.embedPlannerUrl,
    "https://mazexpeditions.com/embed/plan-my-trip?source=embed-widget&campaign=april-promo&referral=PARTNER42"
  );
});

test("buildPlannerEmbedSnippet renders a deployable iframe", () => {
  const snippet = buildPlannerEmbedSnippet({
    embedPlannerUrl: "https://mazexpeditions.com/embed/plan-my-trip?source=embed-widget",
  });

  assert.equal(snippet.includes("<iframe"), true);
  assert.equal(snippet.includes("embed/plan-my-trip"), true);
});

test("buildPublicDistributionBootstrap returns a tenant-safe payload", () => {
  const payload = buildPublicDistributionBootstrap({
    tenant: { name: "MAZ Expeditions", slug: "maz-expeditions" },
    theme: { primaryColor: "#17331c" },
    siteSettings: { whatsapp: "+255700000000" },
    links: { hostedPlannerUrl: "https://example.com/plan-my-trip" },
  });

  assert.equal(payload.tenant.name, "MAZ Expeditions");
  assert.equal(payload.theme.primaryColor, "#17331c");
  assert.equal(payload.siteSettings.whatsapp, "+255700000000");
});
