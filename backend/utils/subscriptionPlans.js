export const PRICING_PLANS = [
  {
    code: "starter",
    name: "Starter",
    priceMonthlyUsd: 29,
    highlighted: false,
    description: "Small tour operators getting started",
    features: [
      "website-cms",
      "basic-bookings",
      "basic-chatbot",
      "blog-ai",
      "tour-ai",
      "pricing-page",
      "payment-automation",
    ],
    limits: {
      aiGenerations: 20,
      chatbotInteractions: 50,
      socialAccounts: 1,
    },
  },
  {
    code: "growth",
    name: "Growth",
    priceMonthlyUsd: 79,
    highlighted: true,
    description: "Growing tour companies who want more bookings",
    features: [
      "website-cms",
      "basic-bookings",
      "basic-chatbot",
      "blog-ai",
      "tour-ai",
      "pricing-page",
      "social-accounts",
      "social-posts",
      "lead-inbox",
      "sales-chatbot",
      "repurposing",
      "review-automation",
      "payment-automation",
      "travel-documentation-assistant",
    ],
    limits: {
      aiGenerations: 200,
      chatbotInteractions: 500,
      socialAccounts: 2,
    },
  },
  {
    code: "pro",
    name: "Pro",
    priceMonthlyUsd: 199,
    highlighted: false,
    description: "Serious operators ready to scale",
    features: [
      "website-cms",
      "basic-bookings",
      "basic-chatbot",
      "blog-ai",
      "tour-ai",
      "pricing-page",
      "social-accounts",
      "social-posts",
      "lead-inbox",
      "sales-chatbot",
      "repurposing",
      "review-automation",
      "campaigns",
      "repeat-customer-automation",
      "unified-inbox",
      "guide-driver-management",
      "accommodation-coordination",
      "airport-pickup-coordination",
      "payment-automation",
      "whatsapp-automation",
      "travel-documentation-assistant",
      "priority-support",
    ],
    limits: {
      aiGenerations: 1000,
      chatbotInteractions: 3000,
      socialAccounts: 10,
    },
  },
  {
    code: "enterprise",
    name: "Enterprise",
    priceMonthlyUsd: 399,
    highlighted: false,
    description: "Large travel brands with partner operations and advanced coordination needs",
    features: [
      "website-cms",
      "basic-bookings",
      "basic-chatbot",
      "blog-ai",
      "tour-ai",
      "pricing-page",
      "social-accounts",
      "social-posts",
      "lead-inbox",
      "sales-chatbot",
      "repurposing",
      "review-automation",
      "campaigns",
      "repeat-customer-automation",
      "unified-inbox",
      "guide-driver-management",
      "accommodation-coordination",
      "airport-pickup-coordination",
      "payment-automation",
      "dynamic-pricing-engine",
      "competitor-intelligence",
      "multi-language-ai-assistant",
      "travel-documentation-assistant",
      "whatsapp-automation",
      "partner-portal",
      "priority-support",
    ],
    limits: {
      aiGenerations: 5000,
      chatbotInteractions: 10000,
      socialAccounts: 50,
    },
  },
];

export const getPlanDefinition = (planCode = "starter") =>
  PRICING_PLANS.find((plan) => plan.code === planCode) || PRICING_PLANS[0];

export const canAccessFeature = (subscription = {}, featureKey = "") => {
  // 1. Check explicit per-feature overrides first — these are set by the
  //    platform admin and take priority over everything including plan and status.
  //    Handle both plain objects (from .lean()) and Mongoose Map objects.
  const overrides = subscription.featureOverrides;
  if (overrides) {
    if (typeof overrides.has === "function") {
      // Mongoose Map object
      if (overrides.has(featureKey)) {
        return Boolean(overrides.get(featureKey));
      }
    } else if (Object.prototype.hasOwnProperty.call(overrides, featureKey)) {
      // Plain JS object (from .lean())
      return Boolean(overrides[featureKey]);
    }
  }

  // 2. When the platform admin has manually assigned a plan (manualOverride is
  //    true by default for all tenants), bypass the billing status gate and
  //    grant access based purely on plan features. This is the correct semantic:
  //    the admin has explicitly assigned the plan so the payment status is
  //    irrelevant.
  if (subscription.manualOverride) {
    const plan = getPlanDefinition(subscription.plan);
    return plan.features.includes(featureKey);
  }

  // 3. For billing-governed subscriptions (manualOverride false), require an
  //    active payment state before unlocking plan features.
  const status = subscription.status || "inactive";
  const isActive = ["active", "trialing"].includes(status);
  
  if (!isActive) {
    return false;
  }

  const plan = getPlanDefinition(subscription.plan);
  return plan.features.includes(featureKey);
};




export const getPlanLimit = (subscription = {}, limitKey = "") => {
  const plan = getPlanDefinition(subscription.plan);
  return plan.limits?.[limitKey] ?? null;
};
