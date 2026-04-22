const slugifyTitle = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const tokenize = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);

const scoreTourMatch = (messageTokens, tour = {}) => {
  const searchable = [
    tour.title,
    tour.location,
    tour.tourType,
    tour.category,
    tour.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return messageTokens.reduce(
    (score, token) => (searchable.includes(token) ? score + 1 : score),
    0
  );
};

export const buildSalesAssistantPayload = ({ message = "", tours = [] }) => {
  const messageTokens = tokenize(message);
  const rankedTours = tours
    .map((tour) => ({
      ...tour,
      matchScore: scoreTourMatch(messageTokens, tour),
    }))
    .sort((left, right) => right.matchScore - left.matchScore);

  const bestMatch = rankedTours[0];

  if (!bestMatch || bestMatch.matchScore === 0) {
    return {
      summary:
        "This sounds like a custom trip request, so the best next step is to shape it in the tailor-made planner.",
      qualificationQuestion:
        "What travel month and budget range should we design around?",
      quickActions: [
        {
          label: "Design Your Trip",
          href: "/plan-my-trip",
        },
      ],
    };
  }

  return {
    summary: `${bestMatch.title} looks like the strongest fit based on your request.`,
    qualificationQuestion:
      "How many travelers and what date window should we plan around?",
    quickActions: [
      {
        label: "View Matching Package",
        href: `/packages/${slugifyTitle(bestMatch.title)}${bestMatch._id ? `?tourId=${bestMatch._id}` : ""}`,
      },
      {
        label: "Design Your Trip",
        href: "/plan-my-trip",
      },
    ],
  };
};
