import Tenant from "../models/Tenant.js";
import ApiKey from "../models/ApiKey.js";

/**
 * Middleware: authenticate requests using an x-api-key header.
 * On success, attaches req.tenantId and req.tenant (lean Tenant object).
 * On failure, returns 401.
 */
export const requireApiKey = async (req, res, next) => {
  const rawKey = req.headers["x-api-key"];

  if (!rawKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "API key required. Pass your key in the x-api-key header.",
    });
  }

  try {
    const keyRecord = await ApiKey.findByRawKey(rawKey);

    if (!keyRecord) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or revoked API key.",
      });
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "API key has expired.",
      });
    }

    const tenant = await Tenant.findById(keyRecord.tenantId).lean();
    if (!tenant) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Tenant associated with this API key no longer exists.",
      });
    }

    // Attach to request (same contract as tenantMiddleware)
    req.tenantId = keyRecord.tenantId;
    req.tenant = tenant;
    req.apiKeyScopes = keyRecord.scopes || [];

    // Non-blocking: update lastUsedAt
    ApiKey.findByIdAndUpdate(keyRecord._id, { lastUsedAt: new Date() }).catch(() => {});

    next();
  } catch (error) {
    console.error("[ApiKeyAuth] Error:", error.message);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
};

/**
 * Scope guard — use after requireApiKey.
 * requireScope("tours:read") returns middleware that checks scopes.
 */
export const requireScope = (scope) => (req, res, next) => {
  const scopes = req.apiKeyScopes || [];
  if (scopes.includes(scope) || scopes.includes("full:read")) {
    return next();
  }
  return res.status(403).json({
    error: "Forbidden",
    message: `This API key does not have the required scope: ${scope}`,
  });
};
