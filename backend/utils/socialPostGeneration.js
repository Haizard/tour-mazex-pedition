const normalizeWords = (value = "") =>
  value
    .toString()
    .split(/[\s,.-/]+/)
    .map((word) => word.trim())
    .filter(Boolean);

const toHashtag = (value = "") => {
  const compact = value.replace(/[^a-zA-Z0-9]+/g, "");
  return compact ? `#${compact}` : "";
};

const unique = (values = []) => [...new Set(values.filter(Boolean))];

export const generateSocialPostSuggestions = async (tourPackage = {}) => {
  const title = tourPackage.title || "Signature Tour";
  const location = tourPackage.location || tourPackage.startLocation || "Tanzania";
  const duration = tourPackage.duration || "Custom itinerary";
  const description = (tourPackage.description || "").trim();
  const highlights = [
    location,
    duration,
    tourPackage.tourType,
    tourPackage.category,
  ].filter(Boolean);

  const caption = `${title} is ready for travelers seeking ${highlights.join(" | ")}. ${description || "Explore iconic landscapes, thoughtful planning, and a seamless booking experience."}`.trim();
  const alternativeCaptions = [
    `Planning your next escape? ${title} brings you closer to ${location} with a ${duration.toLowerCase()} itinerary designed for memorable moments.`,
    `${title} is one of our favorite ways to experience ${location}. Message us for availability, travel dates, and tailored options.`,
  ];
  const hashtagSeeds = unique([
    ...normalizeWords(title),
    ...normalizeWords(location),
    ...normalizeWords(tourPackage.tourType),
    "Safari",
    "Travel",
    "Adventure",
  ]);
  const hashtags = unique(hashtagSeeds.map(toHashtag)).slice(0, 8);
  const imageCandidates = unique([
    tourPackage.image,
    ...(Array.isArray(tourPackage.galleryImages) ? tourPackage.galleryImages : []),
  ]);

  return {
    title: `${title} Social Post`,
    caption,
    alternativeCaptions,
    hashtags,
    callToAction: "Send us your travel dates to get a custom quote.",
    imageCandidates,
    generationMeta: {
      usedFallback: true,
      source: "tour-package",
      generatedAt: new Date().toISOString(),
    },
  };
};
