import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildGoogleOAuthStartUrl,
  buildTravelerGoogleCallbackHtml,
  decodeGoogleOAuthState,
  exchangeGoogleCodeForProfile,
  hasGoogleOAuthConfig,
  normalizeGoogleProfile,
  sanitizeGoogleReturnTo,
} from "../utils/travelerGoogleAuth.js";
import {
  signTravelerAuthToken,
  verifyTravelerAuthToken,
} from "../utils/travelerAuthTokens.js";
import TravelerIdentity from "../models/TravelerIdentity.js";

test("hasGoogleOAuthConfig requires client id, secret, and redirect uri", () => {
  assert.equal(hasGoogleOAuthConfig({}), false);
  assert.equal(
    hasGoogleOAuthConfig({
      GOOGLE_OAUTH_CLIENT_ID: "client",
      GOOGLE_OAUTH_CLIENT_SECRET: "secret",
      GOOGLE_OAUTH_REDIRECT_URI: "https://example.com/callback",
    }),
    true
  );
});

test("buildGoogleOAuthStartUrl requests Google identity scope and preserves return context", () => {
  const url = buildGoogleOAuthStartUrl(
    { returnTo: "/discover/hotels", sessionKey: "traveler_123" },
    {
      GOOGLE_OAUTH_CLIENT_ID: "client-1",
      GOOGLE_OAUTH_REDIRECT_URI: "https://example.com/api/traveler-auth/google/callback",
    }
  );

  assert.equal(url.startsWith("https://accounts.google.com/o/oauth2/v2/auth?"), true);
  assert.equal(url.includes("client_id=client-1"), true);
  assert.equal(url.includes("openid+email+profile"), true);
  assert.equal(url.includes("state="), true);
});

test("decodeGoogleOAuthState restores safe return path and traveler session", () => {
  const url = buildGoogleOAuthStartUrl(
    { returnTo: "https://evil.example/phish", sessionKey: " traveler_123 " },
    {
      GOOGLE_OAUTH_CLIENT_ID: "client-1",
      GOOGLE_OAUTH_REDIRECT_URI: "https://example.com/api/traveler-auth/google/callback",
    }
  );
  const state = new URL(url).searchParams.get("state");

  assert.deepEqual(decodeGoogleOAuthState(state), {
    returnTo: "/",
    sessionKey: "traveler_123",
  });
  assert.equal(sanitizeGoogleReturnTo("/discover/hotels?destination=Arusha"), "/discover/hotels?destination=Arusha");
});

test("exchangeGoogleCodeForProfile exchanges code and normalizes verified Google profile", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.includes("/token")) {
      return {
        ok: true,
        json: async () => ({ access_token: "access_1" }),
      };
    }
    return {
      ok: true,
      json: async () => ({
        sub: "google-sub-1",
        email: " Traveler@Example.com ",
        email_verified: true,
        name: "Asha Traveler",
        picture: "https://example.com/avatar.png",
      }),
    };
  };

  const profile = await exchangeGoogleCodeForProfile({
    code: "code_1",
    fetchImpl,
    env: {
      GOOGLE_OAUTH_CLIENT_ID: "client",
      GOOGLE_OAUTH_CLIENT_SECRET: "secret",
      GOOGLE_OAUTH_REDIRECT_URI: "https://app.example/api/traveler-auth/google/callback",
    },
  });

  assert.equal(calls.length, 2);
  assert.equal(profile.email, "traveler@example.com");
  assert.equal(profile.googleSubject, "google-sub-1");
  assert.equal(profile.displayName, "Asha Traveler");
});

test("normalizeGoogleProfile rejects unverified Google email", () => {
  assert.throws(
    () =>
      normalizeGoogleProfile({
        sub: "google-sub-1",
        email: "traveler@example.com",
        email_verified: false,
      }),
    /verified email/
  );
});

test("traveler auth token signs and verifies visitor scope", () => {
  const token = signTravelerAuthToken(
    {
      travelerIdentityId: "identity_1",
      email: "traveler@example.com",
      sessionKey: "traveler_123",
    },
    { secret: "test-secret", now: 1000, expiresInMs: 60000 }
  );

  const payload = verifyTravelerAuthToken(token, {
    secret: "test-secret",
    now: 2000,
  });

  assert.equal(payload.scope, "traveler");
  assert.equal(payload.travelerIdentityId, "identity_1");
});

test("traveler Google callback html stores auth token then returns visitor to marketplace", () => {
  const html = buildTravelerGoogleCallbackHtml({
    token: "token_1",
    traveler: { email: "traveler@example.com", displayName: "Asha" },
    returnTo: "/discover/hotels",
  });

  assert.equal(html.includes("localStorage.setItem(\"travelerAuthToken\""), true);
  assert.equal(html.includes("localStorage.setItem(\"travelerProfile\""), true);
  assert.equal(html.includes("window.location.replace(\"/discover/hotels\")"), true);
});

test("traveler identity stores Google account linkage fields", () => {
  const identity = new TravelerIdentity({
    sessionKey: "traveler_123",
    email: "Traveler@Example.com",
    displayName: "Asha Traveler",
    avatarUrl: "https://example.com/avatar.png",
    googleSubject: "google-sub-1",
    authProvider: "google",
  });

  assert.equal(identity.email, "traveler@example.com");
  assert.equal(identity.displayName, "Asha Traveler");
  assert.equal(identity.googleSubject, "google-sub-1");
  assert.equal(identity.authProvider, "google");
});

test("server registers traveler Google auth routes", async () => {
  const source = await readFile(new URL("../server.js", import.meta.url), "utf8");

  assert.equal(source.includes('from "./routes/travelerAuthRoutes.js"'), true);
  assert.equal(source.includes('app.use("/api/traveler-auth", travelerAuthRoutes)'), true);
});

test("tenant auth routes support the Google callback alias used by configured OAuth redirects", async () => {
  const source = await readFile(new URL("../routes/authRoutes.js", import.meta.url), "utf8");

  assert.equal(source.includes("handleTravelerGoogleCallback"), true);
  assert.equal(source.includes('router.get("/callback/google"'), true);
});
