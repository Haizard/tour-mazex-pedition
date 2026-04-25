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
