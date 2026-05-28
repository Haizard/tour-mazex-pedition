export const platformOutreachApiPaths = {
  readiness: () => "/platform-admin/outreach/settings/readiness",
  prospects: () => "/platform-admin/outreach/prospects",
  prospect: (prospectId) => `/platform-admin/outreach/prospects/${encodeURIComponent(prospectId)}`,
  prospectImport: () => "/platform-admin/outreach/prospects/import",
  campaigns: () => "/platform-admin/outreach/campaigns",
  generateCampaignMessage: (campaignId) =>
    `/platform-admin/outreach/campaigns/${encodeURIComponent(campaignId)}/generate`,
  launchCampaign: (campaignId) =>
    `/platform-admin/outreach/campaigns/${encodeURIComponent(campaignId)}/launch`,
  messages: () => "/platform-admin/outreach/messages",
  socialPosts: () => "/platform-admin/outreach/social-posts",
  socialPost: (postId) => `/platform-admin/outreach/social-posts/${encodeURIComponent(postId)}`,
};

export const buildPlatformOutreachProspectsParams = ({ status = "" } = {}) => {
  const normalizedStatus = status.toString().trim();
  return normalizedStatus ? { status: normalizedStatus } : {};
};
