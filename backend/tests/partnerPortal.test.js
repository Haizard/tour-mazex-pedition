import test from "node:test";
import assert from "node:assert/strict";

import { summarizePartnerAccount } from "../utils/partnerPortal.js";

test("summarizePartnerAccount highlights active hotel partners", () => {
  const result = summarizePartnerAccount({
    partnerType: "hotel",
    companyName: "Serengeti Serena Lodge",
    status: "active",
    contactName: "Agnes Mrema",
  });

  assert.equal(result.badgeLabel, "Active");
  assert.equal(result.summary.includes("Serengeti Serena Lodge"), true);
  assert.equal(result.summary.includes("Agnes Mrema"), true);
});

test("summarizePartnerAccount highlights pending agency onboarding", () => {
  const result = summarizePartnerAccount({
    partnerType: "agency",
    companyName: "Kilimanjaro Routes GmbH",
    status: "pending",
  });

  assert.equal(result.badgeLabel, "Pending");
  assert.equal(result.summary.includes("onboarding"), true);
});
