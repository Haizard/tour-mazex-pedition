import test from "node:test";
import assert from "node:assert/strict";

import {
  TRAVELER_GOOGLE_PROMPT_DELAY_MS,
  buildTravelerGoogleAuthUrl,
  isTravelerGooglePromptPath,
  shouldScheduleTravelerGooglePrompt,
} from "./travelerGooglePromptState.js";

test("traveler Google prompt waits 30 seconds before showing", () => {
  assert.equal(TRAVELER_GOOGLE_PROMPT_DELAY_MS, 30000);
});

test("traveler Google prompt is eligible on platform and marketplace paths", () => {
  assert.equal(isTravelerGooglePromptPath("/", true), true);
  assert.equal(isTravelerGooglePromptPath("/discover/hotels", false), true);
  assert.equal(isTravelerGooglePromptPath("/demo/mazexpeditions", false), false);
});

test("shouldScheduleTravelerGooglePrompt keeps browsing soft and skips signed-in or dismissed visitors", () => {
  assert.equal(shouldScheduleTravelerGooglePrompt({ pathname: "/discover", isAdminRoute: false }), true);
  assert.equal(shouldScheduleTravelerGooglePrompt({ pathname: "/discover", isSignedIn: true }), false);
  assert.equal(shouldScheduleTravelerGooglePrompt({ pathname: "/discover", isDismissed: true }), false);
  assert.equal(shouldScheduleTravelerGooglePrompt({ pathname: "/admin", isAdminRoute: true }), false);
});

test("buildTravelerGoogleAuthUrl preserves return path and traveler session", () => {
  assert.equal(
    buildTravelerGoogleAuthUrl({ returnTo: "/discover/hotels", sessionKey: "traveler_123" }),
    "/api/traveler-auth/google?returnTo=%2Fdiscover%2Fhotels&sessionKey=traveler_123"
  );
});
