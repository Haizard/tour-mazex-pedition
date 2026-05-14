import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAudienceImportCandidates,
  buildEmailAudienceContactPayload,
} from "../utils/emailAudienceContacts.js";

test("buildEmailAudienceContactPayload normalizes email and tags", () => {
  const payload = buildEmailAudienceContactPayload({
    email: " Traveler@Example.com ",
    firstName: "Asha",
    tags: "vip, safari, vip",
  });

  assert.equal(payload.email, "traveler@example.com");
  assert.equal(payload.firstName, "Asha");
  assert.deepEqual(payload.tags, ["vip", "safari"]);
});

test("buildAudienceImportCandidates merges inquiry and contact sources by email", () => {
  const candidates = buildAudienceImportCandidates({
    inquiries: [
      {
        _id: "inq_1",
        email: "traveler@example.com",
        firstName: "Asha",
        lastName: "N",
        phone: "+255700000000",
        sourceChannel: "plan-my-trip",
        contactPreference: "email",
      },
    ],
    contactMessages: [
      {
        _id: "msg_1",
        email: "traveler@example.com",
        name: "Asha N",
      },
      {
        _id: "msg_2",
        email: "guest@example.com",
        name: "Guest User",
      },
    ],
  });

  assert.equal(candidates.length, 2);
  const traveler = candidates.find((item) => item.email === "traveler@example.com");
  assert.ok(traveler);
  assert.equal(traveler.firstName, "Asha");
  assert.ok(traveler.tags.includes("lead"));
  assert.ok(traveler.tags.includes("website-contact"));
});
