export const filterRestaurantClaimRows = (claims = [], filters = {}) => {
  const search = String(filters.search || "").trim().toLowerCase();
  const status = String(filters.status || "").trim().toLowerCase();

  return claims.filter((claim) => {
    if (status && String(claim.status || "").toLowerCase() !== status) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      claim.restaurantNameSnapshot,
      claim.destinationSnapshot,
      claim.claimantName,
      claim.claimantEmail,
      claim.requestedUsername,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
};

export const buildRestaurantClaimReviewPayload = (
  action = "approve",
  reviewNote = ""
) => ({
  action,
  reviewNote: String(reviewNote || "").trim(),
});
