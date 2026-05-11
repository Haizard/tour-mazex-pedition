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
  const travelerTypeCounts = new Map();
  const travelMonthCounts = new Map();
  const verificationBreakdown = { booking: 0, inquiry: 0 };

  let total = 0;
  for (const review of eligible) {
    const rating = Number(review.rating || 0);
    if (ratingDistribution[rating] != null) {
      ratingDistribution[rating] += 1;
    }
    total += rating;
    if (verificationBreakdown[review.verificationType] != null) {
      verificationBreakdown[review.verificationType] += 1;
    }

    if (review.travelerType) {
      travelerTypeCounts.set(review.travelerType, (travelerTypeCounts.get(review.travelerType) || 0) + 1);
    }

    if (review.travelMonth) {
      travelMonthCounts.set(review.travelMonth, (travelMonthCounts.get(review.travelMonth) || 0) + 1);
    }

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

  const toSortedBreakdown = (counts) =>
    [...counts.entries()]
      .sort((left, right) => {
        if (right[1] === left[1]) {
          return left[0].localeCompare(right[0]);
        }
        return right[1] - left[1];
      })
      .map(([label, count]) => ({ label, count }));

  const sentimentHighlights = [...sentimentCounts.entries()]
    .sort((left, right) => {
      if (right[1] === left[1]) {
        return left[0].localeCompare(right[0]);
      }
      return right[1] - left[1];
    })
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  return {
    averageRating: reviewCount ? Number((total / reviewCount).toFixed(1)) : null,
    reviewCount,
    ratingDistribution,
    topSentimentTags,
    sentimentHighlights,
    travelerTypeBreakdown: toSortedBreakdown(travelerTypeCounts),
    travelMonthBreakdown: toSortedBreakdown(travelMonthCounts),
    verificationBreakdown,
  };
};
