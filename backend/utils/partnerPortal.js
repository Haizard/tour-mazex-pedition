export const summarizePartnerAccount = (partner = {}) => {
  const companyName = partner.companyName || "Partner";
  const contactName = partner.contactName || "No primary contact";
  const partnerType = partner.partnerType || "partner";

  if (partner.status === "active") {
    return {
      badgeLabel: "Active",
      summary: `${companyName} is active as a ${partnerType} partner with ${contactName} as the main contact.`,
    };
  }

  if (partner.status === "inactive") {
    return {
      badgeLabel: "Inactive",
      summary: `${companyName} is inactive and needs reactivation before new partner collaboration starts.`,
    };
  }

  return {
    badgeLabel: "Pending",
    summary: `${companyName} is still onboarding as a ${partnerType} partner.`,
  };
};

// ── Collaboration Task State System ─────────────────────────────────────────

/**
 * All valid stages in the partner collaboration lifecycle.
 * Maps from tenant operator → partner supplier coordination.
 */
export const PARTNER_TASK_STAGES = [
  "pending_confirmation",  // Sent to partner, awaiting acknowledgement
  "confirmed",             // Partner acknowledged the assignment
  "in_execution",          // Trip/service is actively running
  "completed",             // Service delivered and closed
  "disputed",              // Issue raised by partner or operator
  "cancelled",             // Cancelled before execution
];

/**
 * Builds a partner task state object for a booking assignment.
 * Represents one shared coordination unit between operator and partner.
 */
export const buildPartnerTaskState = ({
  taskId,
  bookingId,
  partnerId,
  tenantId,
  taskType = "general",      // "accommodation", "guide", "transport", "airport_pickup"
  stage = "pending_confirmation",
  notes = "",
  dueAt = null,
} = {}) => {
  if (!PARTNER_TASK_STAGES.includes(stage)) {
    throw new Error(`Invalid partner task stage: "${stage}". Must be one of: ${PARTNER_TASK_STAGES.join(", ")}`);
  }

  return {
    taskId: taskId || `task_${Date.now()}`,
    bookingId: String(bookingId || ""),
    partnerId: String(partnerId || ""),
    tenantId: String(tenantId || ""),
    taskType,
    stage,
    notes: String(notes || ""),
    dueAt: dueAt ? new Date(dueAt).toISOString() : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Builds a human-readable shared confirmation message for dispatch to the partner.
 * Used to generate WhatsApp / email coordination drafts.
 */
export const buildSharedConfirmation = (task = {}, partnerName = "Partner") => {
  const { taskType, bookingId, dueAt, notes } = task;

  const typeLabel = {
    accommodation: "accommodation stay",
    guide: "guided tour assignment",
    transport: "transport service",
    airport_pickup: "airport pickup",
    general: "service assignment",
  }[taskType] || "service assignment";

  const dueLine = dueAt
    ? `scheduled for ${new Date(dueAt).toLocaleDateString("en-GB", { dateStyle: "long" })}`
    : "with date TBC";

  const notesLine = notes ? `\n\nAdditional notes: ${notes}` : "";

  return {
    subject: `Booking Confirmation Request — ${typeLabel} [${bookingId}]`,
    body: `Dear ${partnerName},\n\nPlease confirm your availability for the following ${typeLabel} ${dueLine}.\n\nBooking Reference: ${bookingId}${notesLine}\n\nKindly reply with your confirmation at your earliest convenience.\n\nThank you.`,
    stage: task.stage,
    taskId: task.taskId,
  };
};

/**
 * Returns the ordered list of valid task stages.
 */
export const listTaskStages = () => [...PARTNER_TASK_STAGES];

/**
 * Checks if a stage transition is valid (must move forward, not backward, except cancellation).
 */
export const isValidStageTransition = (currentStage, nextStage) => {
  if (nextStage === "cancelled") return true;
  if (nextStage === "disputed") return true;
  const currentIdx = PARTNER_TASK_STAGES.indexOf(currentStage);
  const nextIdx = PARTNER_TASK_STAGES.indexOf(nextStage);
  return nextIdx > currentIdx;
};
