import { publishFacebookPost, publishInstagramPost } from "./metaGraphApi.js";

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const buildSocialAutomationDashboard = (posts = [], accounts = []) => {
  const now = Date.now();
  const dueScheduledPosts = (posts || []).filter((post) => {
    if (post.status !== "scheduled") {
      return false;
    }

    const scheduledFor = toDate(post.scheduledFor);
    return scheduledFor && scheduledFor.getTime() <= now;
  });

  return {
    stats: {
      totalPosts: (posts || []).length,
      scheduledPosts: (posts || []).filter((post) => post.status === "scheduled").length,
      dueNow: dueScheduledPosts.length,
      publishedPosts: (posts || []).filter((post) => post.status === "published").length,
      activeAccounts: (accounts || []).filter((account) => account.status === "active").length,
    },
    duePosts: dueScheduledPosts.map((post) => ({
      _id: post._id,
      title: post.title,
      scheduledFor: post.scheduledFor,
      platforms: post.platforms || [],
      status: post.status,
    })),
  };
};

export const publishSocialPostToPlatforms = async (socialPost, metaAccount) => {
  const publishResult = {};

  if ((socialPost.platforms || []).includes("facebook")) {
    publishResult.facebook = await publishFacebookPost(metaAccount, socialPost);
  }

  if ((socialPost.platforms || []).includes("instagram")) {
    if (!metaAccount.instagramBusinessAccountId) {
      throw new Error("Instagram publishing requires an Instagram Business Account ID.");
    }

    publishResult.instagram = await publishInstagramPost(metaAccount, socialPost);
  }

  return publishResult;
};
