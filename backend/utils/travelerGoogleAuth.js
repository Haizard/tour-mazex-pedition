import { Buffer } from "node:buffer";

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
  Buffer.from(JSON.stringify({ returnTo, sessionKey })).toString("base64url");

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
