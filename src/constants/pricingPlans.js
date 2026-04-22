export const PRICING_PLANS = [
  {
    code: "starter",
    name: "Starter",
    priceMonthlyUsd: 29,
    highlighted: false,
    description: "Best for small tour operators getting started.",
    cta: "Start Free Trial",
    features: [
      "Professional tourism website + CMS",
      "Manage tours, bookings, and inquiries",
      "AI-generated blogs and tour descriptions",
      "Basic chatbot support",
      "1 connected social account",
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
    description: "Best for operators who want more bookings from social and lead capture.",
    cta: "Most Popular",
    features: [
      "Everything in Starter",
      "Instagram and Facebook automation",
      "AI captions and hashtags",
      "Lead inbox and qualification flows",
      "Email follow-up automation",
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
    description: "Best for serious tour companies ready to scale across channels.",
    cta: "Scale Faster",
    features: [
      "Everything in Growth",
      "WhatsApp automation",
      "Unified inbox operations",
      "Campaign automation",
      "Advanced analytics and priority support",
    ],
    limits: {
      aiGenerations: 1000,
      chatbotInteractions: 3000,
      socialAccounts: 10,
    },
  },
];

export const FEATURE_PLAN_REQUIREMENTS = {
  "social-accounts": "growth",
  "social-posts": "growth",
  "lead-inbox": "growth",
  repurposing: "growth",
  campaigns: "pro",
  "whatsapp-automation": "pro",
};

export const getPricingPlan = (planCode = "starter") =>
  PRICING_PLANS.find((plan) => plan.code === planCode) || PRICING_PLANS[0];

