import { Buffer } from "node:buffer";

export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

export const hasGoogleOAuthConfig = (env = {}) =>
  Boolean(
    env.GOOGLE_OAUTH_CLIENT_ID &&
      env.GOOGLE_OAUTH_CLIENT_SECRET &&
      env.GOOGLE_OAUTH_REDIRECT_URI
  );

export const encodeGoogleOAuthState = ({
  returnTo = "/",
  sessionKey = "",
} = {}) =>
  Buffer.from(
    JSON.stringify({
      returnTo: sanitizeGoogleReturnTo(returnTo),
      sessionKey: String(sessionKey || "").trim(),
    })
  ).toString("base64url");

export const sanitizeGoogleReturnTo = (returnTo = "/") => {
  const value = String(returnTo || "/").trim();
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
};

export const decodeGoogleOAuthState = (state = "") => {
  try {
    const decoded = JSON.parse(Buffer.from(String(state || ""), "base64url").toString("utf8"));
    return {
      returnTo: sanitizeGoogleReturnTo(decoded.returnTo),
      sessionKey: String(decoded.sessionKey || "").trim(),
    };
  } catch (_error) {
    return { returnTo: "/", sessionKey: "" };
  }
};

export const buildGoogleOAuthStartUrl = (context = {}, env = {}) => {
  const params = new URLSearchParams();
  params.set("client_id", env.GOOGLE_OAUTH_CLIENT_ID || "");
  params.set("redirect_uri", env.GOOGLE_OAUTH_REDIRECT_URI || "");
  params.set("response_type", "code");
  params.set("scope", "openid email profile");
  params.set("access_type", "offline");
  params.set("prompt", "select_account");
  params.set("state", encodeGoogleOAuthState(context));

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const normalizeGoogleProfile = (profile = {}) => {
  const email = String(profile.email || "").trim().toLowerCase();
  const googleSubject = String(profile.sub || "").trim();

  if (!googleSubject) {
    throw new Error("Google profile is missing a subject identifier.");
  }

  if (!email || profile.email_verified !== true) {
    throw new Error("Google profile must include a verified email.");
  }

  return {
    googleSubject,
    email,
    displayName: String(profile.name || email.split("@")[0] || "Traveler").trim(),
    avatarUrl: String(profile.picture || "").trim(),
  };
};

const assertOkJson = async (response, message) => {
  if (!response?.ok) {
    const payload = await response?.json?.().catch(() => ({}));
    throw new Error(payload?.error_description || payload?.error || message);
  }

  return response.json();
};

export const exchangeGoogleCodeForProfile = async ({
  code = "",
  fetchImpl = globalThis.fetch,
  env = {},
} = {}) => {
  const trimmedCode = String(code || "").trim();
  if (!trimmedCode) {
    throw new Error("Google authorization code is required.");
  }

  if (!hasGoogleOAuthConfig(env)) {
    throw new Error("Google OAuth configuration is incomplete.");
  }

  const tokenParams = new URLSearchParams();
  tokenParams.set("code", trimmedCode);
  tokenParams.set("client_id", env.GOOGLE_OAUTH_CLIENT_ID);
  tokenParams.set("client_secret", env.GOOGLE_OAUTH_CLIENT_SECRET);
  tokenParams.set("redirect_uri", env.GOOGLE_OAUTH_REDIRECT_URI);
  tokenParams.set("grant_type", "authorization_code");

  const tokenPayload = await assertOkJson(
    await fetchImpl(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams,
    }),
    "Unable to exchange Google authorization code."
  );

  if (!tokenPayload.access_token) {
    throw new Error("Google token response did not include an access token.");
  }

  const profilePayload = await assertOkJson(
    await fetchImpl(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    }),
    "Unable to load Google profile."
  );

  return normalizeGoogleProfile(profilePayload);
};

export const buildTravelerGoogleCallbackHtml = ({
  token = "",
  traveler = {},
  returnTo = "/",
} = {}) => {
  const safeReturnTo = sanitizeGoogleReturnTo(returnTo);
  const safeToken = JSON.stringify(String(token || ""));
  const safeTraveler = JSON.stringify(traveler || {}).replace(/</g, "\\u003c");
  const safeRedirect = JSON.stringify(safeReturnTo);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Signing you in...</title>
  </head>
  <body>
    <script>
      localStorage.setItem("travelerAuthToken", ${safeToken});
      localStorage.setItem("travelerProfile", ${safeTraveler});
      sessionStorage.setItem("traveler-google-prompt-dismissed", "true");
      window.location.replace(${safeRedirect});
    </script>
  </body>
</html>`;
};
