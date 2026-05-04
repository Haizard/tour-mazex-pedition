/**
 * Traveler Portal Token Utility
 *
 * Generates and verifies short-lived, signed tokens that give travelers
 * secure, no-login access to their trip portal page.
 *
 * Uses HMAC-SHA256 (via Node crypto) — no JWT library dependency required.
 * Token format: base64url( JSON payload ) + "." + base64url( HMAC signature )
 */
import { createHmac, randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";

const TOKEN_VERSION = "v1";
const DEFAULT_TTL_HOURS = 72; // 3 days — long enough for pre-trip access

const getSecret = (env = globalThis.process?.env || {}) =>
  env.TRAVELER_PORTAL_SECRET || env.JWT_SECRET || "traveler-portal-insecure-dev-secret";

const base64url = (str) =>
  Buffer.from(str).toString("base64url");

const fromBase64url = (str) =>
  Buffer.from(str, "base64url").toString("utf8");

/**
 * Issue a signed traveler portal token.
 * @param {{ bookingId: string, tenantId: string, travelerEmail: string }} params
 * @returns {string} Signed portal token string
 */
export const issueTravelerPortalToken = (
  { bookingId, tenantId, travelerEmail },
  env = globalThis.process?.env || {},
  ttlHours = DEFAULT_TTL_HOURS
) => {
  if (!bookingId || !tenantId) throw new Error("bookingId and tenantId are required for portal token.");

  const payload = {
    ver: TOKEN_VERSION,
    bid: String(bookingId),
    tid: String(tenantId),
    email: String(travelerEmail || ""),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlHours * 3600,
    nonce: randomBytes(8).toString("hex"),
  };

  const payloadEncoded = base64url(JSON.stringify(payload));
  const sig = createHmac("sha256", getSecret(env))
    .update(payloadEncoded)
    .digest("base64url");

  return `${payloadEncoded}.${sig}`;
};

/**
 * Verify and decode a traveler portal token.
 * @returns {{ valid: boolean, payload?: object, reason?: string }}
 */
export const verifyTravelerPortalToken = (token = "", env = globalThis.process?.env || {}) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false, reason: "malformed_token" };

    const [payloadEncoded, sig] = parts;

    // Verify HMAC signature
    const expectedSig = createHmac("sha256", getSecret(env))
      .update(payloadEncoded)
      .digest("base64url");

    if (sig !== expectedSig) return { valid: false, reason: "invalid_signature" };

    // Decode payload
    const payload = JSON.parse(fromBase64url(payloadEncoded));

    // Check expiry
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return { valid: false, reason: "token_expired" };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "decode_error" };
  }
};
