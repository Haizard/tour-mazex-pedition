import { canAccessFeature } from "../backend/utils/subscriptionPlans.js";

const subscription = {
  "plan": "pro",
  "status": "inactive",
  "billingInterval": "monthly",
  "trialEndsAt": "2026-12-26T00:00:00.000Z",
  "currentPeriodEndsAt": "2026-12-26T00:00:00.000Z",
  "manualOverride": true,
  "featureOverrides": {
    "partner-portal": true,
    "dynamic-pricing-engine": true,
    "competitor-intelligence": true,
    "multi-language-ai-assistant": true
  }
};

const features = [
  "social-accounts",
  "social-posts",
  "lead-inbox",
  "repurposing",
  "review-automation",
  "repeat-customer-automation",
  "unified-inbox",
  "whatsapp-automation"
];

console.log("Subscription status:", subscription.status);
console.log("Manual override:", subscription.manualOverride);
console.log("Plan:", subscription.plan);

features.forEach(f => {
  console.log(`${f}: ${canAccessFeature(subscription, f)}`);
});
