export const buildMarketplaceReviewSummary = (
  reviews = [],
  options = { includeInquiryFeedbackInRatings: false }
) => {
  const includeInquiryFeedbackInRatings = options.includeInquiryFeedbackInRatings === true;
  const eligible = reviews.filter((review) => {
    if (review.visibilityState !== "public") {
      return false;
    }

    if (review.verificationType === "booking") {
      return true;
    }

    return includeInquiryFeedbackInRatings && review.verificationType === "inquiry";
  });

  const reviewCount = eligible.length;
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const sentimentCounts = new Map();

  let total = 0;
  for (const review of eligible) {
    const rating = Number(review.rating || 0);
    if (ratingDistribution[rating] != null) {
      ratingDistribution[rating] += 1;
    }
    total += rating;

    for (const tag of review.sentimentTags || []) {
      sentimentCounts.set(tag, (sentimentCounts.get(tag) || 0) + 1);
    }
  }

  const topSentimentTags = [...sentimentCounts.entries()]
    .sort((left, right) => {
      if (right[1] === left[1]) {
        return left[0].localeCompare(right[0]);
      }
      return right[1] - left[1];
    })
    .slice(0, 3)
    .map(([tag]) => tag);

  return {
    averageRating: reviewCount ? Number((total / reviewCount).toFixed(1)) : null,
    reviewCount,
    ratingDistribution,
    topSentimentTags,
  };
};
