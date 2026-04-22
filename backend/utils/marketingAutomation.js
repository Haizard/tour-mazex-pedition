const firstSentence = (value = "") =>
  value
    .toString()
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)[0] || value;

export const repurposeBlogContent = (blog = {}) => {
  const title = blog.title || "Safari Story";
  const intro = firstSentence(blog.content || "Discover our latest travel insight.");
  const shortTagline = `${title} | ${intro}`;

  return {
    instagramPosts: [
      `${shortTagline} Save this for your next Tanzania adventure.`,
      `${title}: ${intro} Ask us for the best season and routing options.`,
      `${title} is perfect inspiration for travelers who want smarter safari planning. Message us for a tailored itinerary.`,
    ],
    facebookPosts: [
      `${title}\n\n${intro}\n\nIf you'd like this kind of experience in your own itinerary, our team can build the trip around your travel dates and budget.`,
      `Fresh from our travel desk: ${title}.\n\n${intro}\n\nReply if you want package suggestions that match this theme.`,
    ],
    emailCampaign: {
      subject: `${title} | Fresh Tanzania travel insight`,
      previewText: intro,
      body: `${title}\n\n${intro}\n\nWe can also turn this inspiration into a bookable safari plan with matching lodges, migration timing, and custom pacing.`,
    },
    whatsappMessage: `${title} - ${intro} If you want a similar safari experience, send us your travel month and budget and we will suggest the best route.`,
  };
};

export const generateCampaignSuggestion = ({
  campaignType = "custom",
  title = "New Campaign",
  month = "",
} = {}) => {
  const lowerType = campaignType.toLowerCase();
  const summaryByType = {
    migration: `A migration-focused campaign timed for ${month || "peak viewing months"} to push urgency, wildlife spectacle, and booking conversion.`,
    seasonal: `A seasonal offer campaign tailored to ${month || "the current travel window"} with value messaging and timing-based promotion.`,
    holiday: `A holiday campaign built for travelers planning around ${month || "upcoming holiday dates"} with family and premium stay angles.`,
    custom: "A custom campaign designed around a focused audience, clear CTA, and multi-channel promotion.",
  };

  return {
    title,
    campaignType: lowerType,
    summary: summaryByType[lowerType] || summaryByType.custom,
    status: "draft",
    channels: ["instagram", "facebook", "email", "whatsapp"],
    contentBundle: {
      headline: title,
      primaryCallToAction: "Request your custom itinerary",
      seasonalAngle:
        lowerType === "migration"
          ? "Highlight time-sensitive migration movement and limited ideal dates."
          : "Highlight timing, offers, and traveler fit.",
    },
  };
};
