export const platformOutreachApiPaths = {
  settings: () => "/platform-admin/outreach/settings",
  readiness: () => "/platform-admin/outreach/settings/readiness",
  prospects: () => "/platform-admin/outreach/prospects",
  prospect: (prospectId) => `/platform-admin/outreach/prospects/${encodeURIComponent(prospectId)}`,
  prospectImport: () => "/platform-admin/outreach/prospects/import",
  campaigns: () => "/platform-admin/outreach/campaigns",
  generateCampaignMessage: (campaignId) =>
    `/platform-admin/outreach/campaigns/${encodeURIComponent(campaignId)}/generate`,
  launchCampaign: (campaignId) =>
    `/platform-admin/outreach/campaigns/${encodeURIComponent(campaignId)}/launch`,
  pauseCampaign: (campaignId) =>
    `/platform-admin/outreach/campaigns/${encodeURIComponent(campaignId)}/pause`,
  messages: () => "/platform-admin/outreach/messages",
  sendMessageNow: (messageId) =>
    `/platform-admin/outreach/messages/${encodeURIComponent(messageId)}/send-now`,
  socialPosts: () => "/platform-admin/outreach/social-posts",
  socialPost: (postId) => `/platform-admin/outreach/social-posts/${encodeURIComponent(postId)}`,
  publishSocialPostNow: (postId) =>
    `/platform-admin/outreach/social-posts/${encodeURIComponent(postId)}/publish-now`,
};

export const buildPlatformOutreachProspectsParams = ({ status = "" } = {}) => {
  const normalizedStatus = status.toString().trim();
  return normalizedStatus ? { status: normalizedStatus } : {};
};
