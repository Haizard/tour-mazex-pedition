import {
  canAccessFeature,
  getPlanDefinition,
} from "../utils/subscriptionPlans.js";

const FEATURE_LABELS = {
  "social-accounts": "social channel connections",
  "social-posts": "social publishing",
  "lead-inbox": "lead inbox",
  repurposing: "content repurposing",
  "review-automation": "review automation",
  "repeat-customer-automation": "repeat customer automation",
  "guide-driver-management": "guide and driver management",
  "accommodation-coordination": "accommodation coordination",
  "airport-pickup-coordination": "airport pickup coordination",
  "payment-automation": "payment automation",
  "dynamic-pricing-engine": "dynamic pricing engine",
  "partner-portal": "partner portal",
  campaigns: "campaign automation",
  "whatsapp-automation": "WhatsApp automation",
};

export const requireSubscriptionFeature = (featureKey) => (req, res, next) => {
  const subscription = req.tenant?.subscription || {};

  if (canAccessFeature(subscription, featureKey)) {
    return next();
  }

  const currentPlan = getPlanDefinition(subscription.plan);

  return res.status(403).json({
    message: `Your current subscription does not include ${FEATURE_LABELS[featureKey] || featureKey}.`,
    featureKey,
    upgradeRequired: true,
    currentPlan: currentPlan.code,
    subscriptionStatus: subscription.status || "inactive",
  });
};

