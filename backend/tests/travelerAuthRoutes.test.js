import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildGoogleOAuthStartUrl,
  hasGoogleOAuthConfig,
} from "../utils/travelerGoogleAuth.js";

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

test("server registers traveler Google auth routes", async () => {
  const source = await readFile(new URL("../server.js", import.meta.url), "utf8");

  assert.equal(source.includes('from "./routes/travelerAuthRoutes.js"'), true);
  assert.equal(source.includes('app.use("/api/traveler-auth", travelerAuthRoutes)'), true);
});
