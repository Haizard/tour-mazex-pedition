const formatShortDate = (value = "") => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const getOperatorTrustLabel = (tour = null) => {
  const operatorName =
    tour?.operator?.companyName ||
    tour?.operator?.displayName ||
    tour?.operator?.name ||
    tour?.operator?.slug ||
    "";

  if (operatorName) {
    return `Listed operator: ${operatorName}`;
  }

  return "Listed marketplace operator";
};

export const getOperatorTrustSupportCopy = (tour = null) => {
  const operatorName =
    tour?.operator?.companyName ||
    tour?.operator?.displayName ||
    tour?.operator?.name ||
    "the listed operator";

  return `Pricing, fulfillment, and traveler follow-up stay with ${operatorName}.`;
};

export const getDepartureConfidenceTone = (entry = null) => {
  if (!entry) return "bg-slate-100 text-slate-700";
  if (entry.status === "available") return "bg-[#e1efe6] text-[#234232]";
  if (entry.status === "limited") return "bg-[#fff3d6] text-[#8a5a05]";
  if (entry.status === "unavailable") return "bg-[#fde7e7] text-[#a33b3b]";
  return "bg-slate-100 text-slate-700";
};

export const getDepartureConfidenceCopy = (entry = null) => {
  if (!entry) {
    return "Published dates are confirmed on request with the listed operator.";
  }

  const formattedDate = formatShortDate(entry.date);
  const dateLabel = formattedDate ? ` on ${formattedDate}` : "";

  if (entry.status === "limited" && typeof entry.remainingSpots === "number") {
    const spotWord = entry.remainingSpots === 1 ? "spot" : "spots";
    return `Limited published departure${dateLabel} with ${entry.remainingSpots} ${spotWord} noted.`;
  }

  if (entry.status === "unavailable") {
    return `Published departure${dateLabel} is currently unavailable.`;
  }

  if (entry.status === "on-request") {
    return `Published departure${dateLabel} is currently request-based.`;
  }

  if (typeof entry.remainingSpots === "number") {
    const spotWord = entry.remainingSpots === 1 ? "spot" : "spots";
    return `Published departure${dateLabel} with ${entry.remainingSpots} ${spotWord} noted.`;
  }

  return `Published departure${dateLabel || ""} ready for traveler inquiries.`.trim();
};

export const getTravelerProofSummary = (summary = null) => {
  const reviewCount = Number(summary?.reviewCount || 0);
  const averageRating = summary?.averageRating;
  const bookingCount = Number(summary?.verificationBreakdown?.booking || 0);
  const inquiryCount = Number(summary?.verificationBreakdown?.inquiry || 0);

  if (reviewCount > 0) {
    const ratingPart = averageRating ? `${averageRating}/5 average from ` : "";
    return `${ratingPart}${reviewCount} published reviews, led by ${bookingCount} verified bookings and ${inquiryCount} verified inquiries.`;
  }

  return "Traveler proof will strengthen here as verified reviews, photos, and questions grow.";
};

export const getInquiryReassuranceCopy = (tour = null, selectedAvailability = null) => {
  const operatorName =
    tour?.operator?.companyName ||
    tour?.operator?.displayName ||
    tour?.operator?.name ||
    "the listed operator";

  if (selectedAvailability?.status === "on-request") {
    return `This request will be routed to ${operatorName}, who can confirm request-based availability and next steps.`;
  }

  if (selectedAvailability?.status === "limited") {
    return `This request will be routed to ${operatorName} while the current limited departure is still being managed.`;
  }

  return `Marketplace inquiries from this page are routed directly to ${operatorName}.`;
};
