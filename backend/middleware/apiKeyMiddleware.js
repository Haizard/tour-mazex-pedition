import Tenant from "../models/Tenant.js";

/**
 * Middleware to authenticate public API requests using x-api-key and x-tenant-id.
 * 
 * [SKILL: Security Architecture]
 */
export const requirePublicApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const tenantId = req.headers["x-tenant-id"];

  if (!apiKey || !tenantId) {
    return res.status(401).json({ 
      message: "Authentication failed. x-api-key and x-tenant-id headers are required." 
    });
  }

  try {
    // In a real production environment, we would use a dedicated API key table
    // or a hashed secret. For this implementation, we check if the tenant exists
    // and if the key matches a designated 'apiKey' field (or fallback to a derived secret).
    const tenant = await Tenant.findOne({ 
      _id: tenantId,
      $or: [
        { apiKey: apiKey },
        { "settings.apiSecret": apiKey } // fallback to settings if defined
      ]
    });

    if (!tenant) {
      return res.status(403).json({ message: "Invalid API Key or Tenant ID." });
    }

    // Attach tenant to request for context
    req.tenant = tenant;
    req.tenantId = tenantId;
    
    next();
  } catch (error) {
    console.error("API Key Auth Error:", error);
    res.status(500).json({ message: "Internal server error during authentication." });
  }
};
