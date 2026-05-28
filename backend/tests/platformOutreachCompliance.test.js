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
