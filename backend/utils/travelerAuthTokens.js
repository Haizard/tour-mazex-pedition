import crypto from "crypto";
import { Buffer } from "node:buffer";
import process from "node:process";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const getTravelerAuthSecret = (options = {}) =>
  options.secret ||
  process.env.TRAVELER_AUTH_SECRET ||
  process.env.JWT_SECRET ||
  "unsafe-dev-traveler-secret";

const toBase64Url = (value) => Buffer.from(value).toString("base64url");
const fromBase64Url = (value) => Buffer.from(value, "base64url").toString("utf8");

export const signTravelerAuthToken = (
  {
    travelerIdentityId,
    email = "",
    sessionKey = "",
    expiresInMs = TOKEN_TTL_MS,
  } = {},
  options = {}
) => {
  if (!travelerIdentityId) {
    throw new Error("travelerIdentityId is required for traveler auth token.");
  }

  const now = Number(options.now || Date.now());
  const payload = {
    travelerIdentityId: String(travelerIdentityId),
    email: String(email || "").trim().toLowerCase(),
    sessionKey: String(sessionKey || "").trim(),
    scope: "traveler",
    exp: now + expiresInMs,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", getTravelerAuthSecret(options))
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
};

export const verifyTravelerAuthToken = (token, options = {}) => {
  if (!token || !token.includes(".")) {
    throw new Error("Invalid traveler token format.");
  }

  const [encodedPayload, signature] = token.split(".");
  const expectedSignature = crypto
    .createHmac("sha256", getTravelerAuthSecret(options))
    .update(encodedPayload)
    .digest("base64url");

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw new Error("Invalid traveler token signature.");
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload));
  const now = Number(options.now || Date.now());

  if (!payload.exp || payload.exp < now) {
    throw new Error("Traveler token expired.");
  }

  if (payload.scope !== "traveler") {
    throw new Error("Token is not a traveler token.");
  }

  return payload;
};
