export const resolveReviewModerationState = ({ verificationType, tenantSettings = {} }) => {
  const autoPublish = verificationType === "booking" && tenantSettings.autoPublishVerifiedReviews === true;

  return autoPublish
    ? { moderationStatus: "approved", visibilityState: "public" }
    : { moderationStatus: "pending", visibilityState: "private" };
};

export const resolveQuestionModerationState = ({ tenantSettings = {} }) =>
  tenantSettings.autoPublishTravelerQuestions === true ? "approved" : "pending";

export const resolvePhotoModerationState = ({ tenantSettings = {} }) =>
  tenantSettings.requirePhotoModeration === false ? "approved" : "pending";
