/**
 * Trust & Fraud Scoring Layer
 *
 * Scores every inquiry and booking for fraud risk signals without
 * blocking the booking creation flow (non-blocking, async-safe).
 *
 * Risk signals:
 * - Velocity: multiple bookings from same email/phone within 24h
 * - Budget vs group size mismatch (extremely low budget for large group)
 * - Disposable email domain detection
 * - Unrealistic travel window (travel date in the past or < 24h away)
 */

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwam.com",
  "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "trashmail.com",
  "10minutemail.com", "maildrop.cc", "fakeinbox.com", "dispostable.com",
]);

/**
 * Scores an inquiry/booking payload.
 * @returns {{ score: number, riskLevel: string, signals: string[] }}
 */
export const scoreTrustSignals = (payload = {}) => {
  const signals = [];
  let score = 100; // Start at 100, deduct for each risk signal

  const {
    email = "",
    phone = "",
    adults = 1,
    children = 0,
    budget = "",
    travelWhen = "",
    name = "",
    firstName = "",
  } = payload;

  // 1. Disposable email domain check
  const emailDomain = email.split("@")[1]?.toLowerCase() || "";
  if (DISPOSABLE_DOMAINS.has(emailDomain)) {
    score -= 40;
    signals.push("disposable_email_domain");
  }

  // 2. Missing or suspicious name
  const fullName = (name || `${firstName}`).trim();
  if (fullName.length < 2) {
    score -= 15;
    signals.push("missing_name");
  }
  if (/^[a-z]{1,2}$/.test(fullName.toLowerCase())) {
    score -= 20;
    signals.push("suspicious_single_char_name");
  }

  // 3. Invalid phone (too short or placeholder)
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) {
    score -= 20;
    signals.push("invalid_phone_length");
  }
  if (/^(\d)\1+$/.test(digits) && digits.length > 4) {
    score -= 25;
    signals.push("repeated_digit_phone");
  }

  // 4. Budget vs group size mismatch
  const budgetNum = parseFloat(String(budget).replace(/[^0-9.]/g, "")) || 0;
  const groupSize = Number(adults || 1) + Number(children || 0);
  if (budgetNum > 0 && budgetNum < 200 && groupSize > 4) {
    score -= 20;
    signals.push("budget_group_size_mismatch");
  }

  // 5. Unrealistic travel window
  if (travelWhen) {
    const travelDate = new Date(travelWhen);
    const now = new Date();
    if (!isNaN(travelDate.getTime())) {
      const hoursUntilTravel = (travelDate - now) / (1000 * 60 * 60);
      if (hoursUntilTravel < 0) {
        score -= 30;
        signals.push("travel_date_in_past");
      } else if (hoursUntilTravel < 24) {
        score -= 15;
        signals.push("travel_date_less_than_24h");
      }
    }
  }

  const clampedScore = Math.max(0, Math.min(100, score));
  const riskLevel =
    clampedScore >= 80 ? "low" :
    clampedScore >= 55 ? "medium" :
    clampedScore >= 30 ? "high" : "critical";

  return {
    trustScore: clampedScore,
    riskLevel,
    signals,
    reviewRequired: riskLevel === "high" || riskLevel === "critical",
  };
};

/**
 * Velocity-checks an email against recent bookings in PostgreSQL.
 * Returns true if the same email has made >= threshold bookings in the window.
 */
export const checkVelocityRisk = async (email, tenantId, env = globalThis.process?.env || {}, { thresholdCount = 3, windowHours = 24 } = {}) => {
  // Import here to avoid circular dependencies
  const { createPostgresClient } = await import("./postgresClient.js");
  const client = createPostgresClient(env);
  if (!client || !email) return { isVelocityRisk: false, count: 0 };

  try {
    await client.connect();
    const result = await client.query(`
      select count(*) as cnt
      from public.booking_lifecycle_records
      where tenant_id = $1
        and traveler_email = $2
        and created_at >= now() - interval '${windowHours} hours'
    `, [tenantId, email.toLowerCase()]);

    const count = Number(result.rows[0]?.cnt || 0);
    return { isVelocityRisk: count >= thresholdCount, count };
  } catch {
    return { isVelocityRisk: false, count: 0 };
  } finally {
    await client.end().catch(() => {});
  }
};

/**
 * Full trust evaluation combining static signals + optional velocity check.
 */
export const evaluateTrust = async (payload = {}, tenantId = "", env = {}) => {
  const staticScore = scoreTrustSignals(payload);
  const velocity = await checkVelocityRisk(payload.email, tenantId, env);

  let adjustedScore = staticScore.trustScore;
  const combinedSignals = [...staticScore.signals];

  if (velocity.isVelocityRisk) {
    adjustedScore = Math.max(0, adjustedScore - 35);
    combinedSignals.push(`velocity_risk_${velocity.count}_bookings_24h`);
  }

  const clampedScore = Math.max(0, Math.min(100, adjustedScore));
  const riskLevel =
    clampedScore >= 80 ? "low" :
    clampedScore >= 55 ? "medium" :
    clampedScore >= 30 ? "high" : "critical";

  return {
    trustScore: clampedScore,
    riskLevel,
    signals: combinedSignals,
    reviewRequired: riskLevel === "high" || riskLevel === "critical",
    velocity,
  };
};
