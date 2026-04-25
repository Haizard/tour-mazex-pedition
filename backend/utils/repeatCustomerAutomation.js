import { calculateCustomerSegment, getSegmentPerks } from "./customerSegmentation.js";

const formatTravelDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export const buildRepeatCustomerAutomation = ({
  booking = {},
  bookingHistory = [],
  tenantName = "Your safari team",
} = {}) => {
  const guestName = booking.name?.split(" ")[0] || "Traveler";
  const packageTitle = booking.packageTour || "your safari";
  const travelDateLabel = formatTravelDate(booking.travelDate);
  
  const segment = calculateCustomerSegment(bookingHistory);
  const perks = getSegmentPerks(segment);
  
  const campaignType = segment === "First-Timer" ? "referral" : "anniversary";
  const audienceTag = segment.toLowerCase();
  
  let offerLabel = "Exclusive Return Offer";
  let subject = `${tenantName}: A special gift for your next journey`;
  let messageParts = [`Hi ${guestName},`];

  if (segment === "VIP") {
    offerLabel = "VIP Loyalty Recognition";
    subject = `Exclusive VIP Invitation from ${tenantName}`;
    messageParts.push(
      `It has been an absolute honor hosting you on your recent ${packageTitle}. Because of your incredible loyalty to ${tenantName}, we have officially upgraded your status to VIP.`,
      `For your next journey, you will automatically enjoy:`,
      ...perks.map(p => `• ${p}`),
      `Whenever you're ready for the wild again, your dedicated planner is standing by.`
    );
  } else if (segment === "Loyal") {
    offerLabel = "Loyalty Appreciation Offer";
    subject = `Welcome back to the family, ${guestName}`;
    messageParts.push(
      `We loved having you back for ${packageTitle}. As a token of our appreciation for your continued trust in ${tenantName}, we've prepared a 'Loyalty Pack' for your next trip:`,
      ...perks.map(p => `• ${p}`),
      `Shall we start looking at some new horizons for your next visit?`
    );
  } else if (segment === "Lapsed") {
    offerLabel = "Welcome Back Priority";
    subject = `We miss you, ${guestName}!`;
    messageParts.push(
      `It's been a while since we last saw you in the bush! We're reaching out because we'd love to welcome you back to Tanzania.`,
      `A lot has changed since your ${packageTitle} trip, and we'd love to show you our newest private conservancies.`,
      `Book your return this season and we'll include:`,
      ...perks.map(p => `• ${p}`)
    );
  } else {
    // First-Timer / Referral focus
    offerLabel = "Referral Reward Program";
    subject = `Share the magic of Africa, ${guestName}`;
    messageParts.push(
      `We hope the memories of ${packageTitle} are still making you smile!`,
      `If you have friends dreaming of a similar adventure, we'd love to treat them (and you).`,
      `Refer a friend who books a safari, and you'll both receive:`,
      ...perks.map(p => `• ${p}`),
      `Simply share your unique referral code or reply to this message to introduce us.`
    );
  }

  return {
    guestName: booking.name,
    guestEmail: booking.email || "",
    bookingLabel: packageTitle,
    campaignType,
    segment,
    channel: segment === "VIP" || segment === "Loyal" ? "whatsapp" : "email",
    audienceTag,
    offerLabel,
    subject,
    message: messageParts.join("\n\n"),
    status: "draft",
    recommendedSendAtLabel: travelDateLabel || "post-trip",
    nextStepChecklist: [
      `Review tailored ${segment} perks in the message`,
      "Confirm guest's preferred contact method (WhatsApp recommended for VIPs)",
      "Send draft and monitor for conversion"
    ],
  };
};
