const allowedStages = new Set(["demo_booked", "trial_started", "subscription_won", "lost"]);
const eventStageMap = new Map([
  ["demo.booked", "demo_booked"],
  ["demo_booked", "demo_booked"],
  ["trial.started", "trial_started"],
  ["trial_started", "trial_started"],
  ["subscription.created", "subscription_won"],
  ["subscription.paid", "subscription_won"],
  ["subscription_won", "subscription_won"],
  ["customer.lost", "lost"],
  ["lost", "lost"],
]);

export const buildPlatformOutreachConversionPayload = ({
  stage = "demo_booked",
  revenueAmount = 0,
  currency = "USD",
  source = "manual-admin",
  occurredAt = new Date(),
  notes = "",
} = {}) => {
  const normalizedStage = allowedStages.has(stage) ? stage : "demo_booked";
  const amount = Number(revenueAmount || 0);
  return {
    stage: normalizedStage,
    revenueAmount: Number.isFinite(amount) ? amount : 0,
    currency: String(currency || "USD").trim().toUpperCase(),
    source: String(source || "manual-admin").trim(),
    occurredAt: new Date(occurredAt),
    notes: String(notes || "").trim(),
  };
};

export const summarizePlatformOutreachConversions = (threads = []) =>
  threads.reduce(
    (summary, thread) => {
      const attribution = thread.conversionAttribution || {};
      if (attribution.stage === "demo_booked") summary.demoBookedCount += 1;
      if (attribution.stage === "trial_started") summary.trialStartedCount += 1;
      if (attribution.stage === "subscription_won") summary.subscriptionWonCount += 1;
      summary.attributedRevenue += Number(attribution.revenueAmount || 0);
      return summary;
    },
    {
      demoBookedCount: 0,
      trialStartedCount: 0,
      subscriptionWonCount: 0,
      attributedRevenue: 0,
    }
  );

export const buildAutomaticPlatformOutreachAttribution = (event = {}) => {
  const eventType = String(event.eventType || event.type || "").trim().toLowerCase();
  const stage = eventStageMap.get(eventType);
  if (!stage) {
    throw new Error("Unsupported platform outreach conversion event type.");
  }

  return {
    ...buildPlatformOutreachConversionPayload({
      stage,
      revenueAmount: event.amount ?? event.revenueAmount ?? 0,
      currency: event.currency || "USD",
      source: "billing-system",
      occurredAt: event.occurredAt || event.createdAt || new Date(),
      notes: event.notes || `Automatically attributed from ${eventType}.`,
    }),
    metadata: {
      eventType,
      prospectId: event.prospectId || "",
      prospectEmail: event.prospectEmail || event.email || "",
      prospectWhatsAppNumber: event.prospectWhatsAppNumber || event.whatsappNumber || "",
      tenantId: event.tenantId || "",
      sourceId: event.sourceId || event.subscriptionId || event.demoId || event.trialId || "",
    },
  };
};
