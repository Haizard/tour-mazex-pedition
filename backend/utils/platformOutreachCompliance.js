const OPT_OUT_TERMS = ["unsubscribe", "stop", "remove me", "do not contact", "don't contact"];

export const classifyOptOutIntent = (text = "") => {
  const normalized = String(text || "").trim().toLowerCase();
  return OPT_OUT_TERMS.some((term) => normalized.includes(term)) ? "opt_out" : "none";
};

export const assertCanSendPlatformMessage = ({ channel = "", prospect = {} } = {}) => {
  if (channel === "email" && prospect.emailOptOut === true) {
    throw new Error("This prospect has an email opt-out record.");
  }

  if (channel === "whatsapp") {
    if (prospect.whatsappOptInStatus === "opted_out") {
      throw new Error("This prospect has opted out of WhatsApp outreach.");
    }

    if (prospect.whatsappOptInStatus !== "opted_in") {
      throw new Error("WhatsApp opt-in evidence is required before sending marketing outreach.");
    }
  }

  return true;
};
