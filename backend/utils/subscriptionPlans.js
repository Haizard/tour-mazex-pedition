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
      "guide-driver-management",
      "whatsapp-automation",
      "priority-support",
    ],
    limits: {
      aiGenerations: 1000,
      chatbotInteractions: 3000,
      socialAccounts: 10,
    },
  },
];

export const getPlanDefinition = (planCode = "starter") =>
  PRICING_PLANS.find((plan) => plan.code === planCode) || PRICING_PLANS[0];

export const canAccessFeature = (subscription = {}, featureKey = "") => {
  const status = subscription.status || "inactive";

  if (!["active", "trialing"].includes(status)) {
    return false;
  }

  if (
    subscription.featureOverrides &&
    Object.prototype.hasOwnProperty.call(subscription.featureOverrides, featureKey)
  ) {
    return Boolean(subscription.featureOverrides[featureKey]);
  }

  const plan = getPlanDefinition(subscription.plan);
  return plan.features.includes(featureKey);
};

export const getPlanLimit = (subscription = {}, limitKey = "") => {
  const plan = getPlanDefinition(subscription.plan);
  return plan.limits?.[limitKey] ?? null;
};
