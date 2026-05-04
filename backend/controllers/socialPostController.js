import SocialPost from "../models/SocialPost.js";
import TourPackage from "../models/TourPackage.js";
import SocialAccount from "../models/SocialAccount.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import {
  buildSocialAutomationDashboard,
  publishSocialPostToPlatforms,
} from "../utils/socialAutomation.js";
import { generateSocialPostSuggestions } from "../utils/socialPostGeneration.js";
import { storeGeneratedMediaAsset } from "../utils/generatedMediaStorage.js";
import { getRedisClient } from "../utils/redisClient.js";
import {
  buildSocialPostDispatchJob,
  enqueueSocialPostDispatchJob,
  markSocialPostDispatchQueued,
} from "../utils/socialPostQueue.js";

const sanitizePlatforms = (platforms = []) =>
  Array.isArray(platforms)
    ? platforms.map((platform) => platform?.toString().trim().toLowerCase()).filter(Boolean)
    : [];

const sanitizeHashtags = (hashtags = []) => {
  if (Array.isArray(hashtags)) {
    return hashtags.map((tag) => tag?.toString().trim()).filter(Boolean);
  }

  if (typeof hashtags === "string") {
    return hashtags
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

const sanitizeImageUrls = (imageUrls = []) =>
  Array.isArray(imageUrls)
    ? imageUrls.map((imageUrl) => imageUrl?.toString().trim()).filter(Boolean)
    : [];

const slugifyFilenamePart = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "creative";

export const resolveSocialPostImageAssets = async ({
  imageUrls = [],
  tenantId = "",
  title = "",
  storeMediaAsset = storeGeneratedMediaAsset,
} = {}) => {
  const normalizedUrls = sanitizeImageUrls(imageUrls);
  const imageAssets = [];

  for (const [index, imageUrl] of normalizedUrls.entries()) {
    if (!imageUrl.startsWith("data:")) {
      imageAssets.push({
        url: imageUrl,
        mediaId: null,
      });
      continue;
    }

    const storedAsset = await storeMediaAsset({
      tenantId,
      filenameBase: `social-post-${slugifyFilenamePart(title)}-image-${index + 1}`,
      dataUrl: imageUrl,
    });

    imageAssets.push({
      url: storedAsset.url,
      mediaId: storedAsset.mediaId,
    });
  }

  return {
    imageUrls: imageAssets.map((asset) => asset.url),
    imageAssets,
  };
};

const ensureFutureSchedule = (scheduledFor) => {
  if (!scheduledFor) {
    return null;
  }

  const scheduleDate = new Date(scheduledFor);

  if (Number.isNaN(scheduleDate.getTime())) {
    return { error: "Please choose a valid schedule date." };
  }

  if (scheduleDate.getTime() <= Date.now()) {
    return { error: "Scheduled posts must be set in the future." };
  }

  return { value: scheduleDate };
};

export const generateSocialPostDraft = async (req, res) => {
  try {
    const { tourPackageId } = req.body;

    if (!tourPackageId) {
      return res.status(400).json({ message: "A tour package is required to generate a social post." });
    }

    const tourPackage = await TourPackage.findOne(buildTenantFilter(req, { _id: tourPackageId }));

    if (!tourPackage) {
      return res.status(404).json({ message: "Tour package not found for this tenant." });
    }

    const suggestions = await generateSocialPostSuggestions(tourPackage.toObject());

    res.status(200).json({
      tourPackageId: tourPackage._id,
      ...suggestions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSocialPosts = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const socialPosts = await SocialPost.find(buildTenantFilter(req, query))
      .sort({ scheduledFor: 1, updatedAt: -1 })
      .lean();

    res.status(200).json(socialPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSocialAutomationDashboard = async (req, res) => {
  try {
    const [socialPosts, socialAccounts] = await Promise.all([
      SocialPost.find(buildTenantFilter(req))
        .sort({ scheduledFor: 1, updatedAt: -1 })
        .lean(),
      SocialAccount.find(buildTenantFilter(req))
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    res.status(200).json(buildSocialAutomationDashboard(socialPosts, socialAccounts));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSocialPost = async (req, res) => {
  try {
    const {
      tourPackageId,
      title,
      platforms,
      status = "draft",
      caption,
      hashtags,
      callToAction,
      imageUrls,
      scheduledFor,
      generationMeta,
    } = req.body;

    if (!tourPackageId) {
      return res.status(400).json({ message: "A tour package is required." });
    }

    const tourPackage = await TourPackage.findOne(buildTenantFilter(req, { _id: tourPackageId }));

    if (!tourPackage) {
      return res.status(404).json({ message: "Tour package not found for this tenant." });
    }

    const normalizedPlatforms = sanitizePlatforms(platforms);
    const scheduleCheck = ensureFutureSchedule(scheduledFor);

    if (scheduleCheck?.error) {
      return res.status(400).json({ message: scheduleCheck.error });
    }

    const normalizedImageAssets = await resolveSocialPostImageAssets({
      imageUrls,
      tenantId: req.tenantId,
      title: title?.trim() || `${tourPackage.title} Social Post`,
    });

    if (status === "scheduled" && normalizedImageAssets.imageUrls.length === 0) {
      return res.status(400).json({ message: "Scheduled posts need at least one image." });
    }

    const socialPost = new SocialPost(
      withTenantId(req, {
        tourPackageId,
        title: title?.trim() || `${tourPackage.title} Social Post`,
        platforms: normalizedPlatforms,
        status,
        caption: caption?.trim(),
        hashtags: sanitizeHashtags(hashtags),
        callToAction: callToAction?.trim(),
        imageUrls: normalizedImageAssets.imageUrls,
        imageAssets: normalizedImageAssets.imageAssets,
        scheduledFor: scheduleCheck?.value || null,
        generationMeta: generationMeta || {},
        createdBy: req.admin?._id?.toString() || "",
      })
    );

    await socialPost.save();
    res.status(201).json(socialPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSocialPost = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.platforms) {
      updates.platforms = sanitizePlatforms(updates.platforms);
    }

    if (updates.hashtags) {
      updates.hashtags = sanitizeHashtags(updates.hashtags);
    }

    if (updates.imageUrls) {
      const normalizedImageAssets = await resolveSocialPostImageAssets({
        imageUrls: updates.imageUrls,
        tenantId: req.tenantId,
        title: updates.title || "",
      });
      updates.imageUrls = normalizedImageAssets.imageUrls;
      updates.imageAssets = normalizedImageAssets.imageAssets;
    }

    if (Object.prototype.hasOwnProperty.call(updates, "scheduledFor")) {
      const scheduleCheck = ensureFutureSchedule(updates.scheduledFor);
      if (scheduleCheck?.error) {
        return res.status(400).json({ message: scheduleCheck.error });
      }
      updates.scheduledFor = scheduleCheck?.value || null;
    }

    const existingPost = await SocialPost.findOne(buildTenantFilter(req, { _id: id }));

    if (!existingPost) {
      return res.status(404).json({ message: "Social post not found." });
    }

    const nextStatus = updates.status || existingPost.status;
    const nextImages = updates.imageUrls || existingPost.imageUrls || [];

    if (nextStatus === "scheduled" && nextImages.length === 0) {
      return res.status(400).json({ message: "Scheduled posts need at least one image." });
    }

    const updatedSocialPost = await SocialPost.findOneAndUpdate(
      buildTenantFilter(req, { _id: id }),
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedSocialPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSocialPost = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSocialPost = await SocialPost.findOneAndDelete(buildTenantFilter(req, { _id: id }));

    if (!deletedSocialPost) {
      return res.status(404).json({ message: "Social post not found." });
    }

    res.status(200).json({ message: "Social post deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const runScheduledSocialPosts = async (req, res) => {
  try {
    const now = new Date();
    const duePosts = await SocialPost.find(
      buildTenantFilter(req, {
        status: "scheduled",
        scheduledFor: { $lte: now },
      })
    ).sort({ scheduledFor: 1, createdAt: 1 });

    if (duePosts.length === 0) {
      return res.status(200).json({
        processedCount: 0,
        publishedCount: 0,
        failedCount: 0,
        results: [],
      });
    }

    const metaAccount = await SocialAccount.findOne(
      buildTenantFilter(req, { provider: "meta", status: "active" })
    );

    if (!metaAccount) {
      return res.status(400).json({
        message: "Connect an active Meta account before running the social automation queue.",
      });
    }

    const redisClient = await getRedisClient().catch(() => null);
    if (redisClient) {
      let queuedCount = 0;
      let skippedCount = 0;

      for (const socialPost of duePosts) {
        const job = buildSocialPostDispatchJob({
          postId: socialPost._id,
          tenantId: socialPost.tenantId,
        });

        const queued = await markSocialPostDispatchQueued({
          redisClient,
          job,
        });

        if (!queued) {
          skippedCount += 1;
          continue;
        }

        await enqueueSocialPostDispatchJob({
          redisClient,
          job,
        });
        queuedCount += 1;
      }

      return res.status(202).json({
        processedCount: 0,
        publishedCount: 0,
        failedCount: 0,
        queuedCount,
        skippedCount,
        mode: "queued",
        results: duePosts.map((post) => ({
          postId: post._id,
          title: post.title,
          status: "queued",
        })),
      });
    }

    const results = [];

    for (const socialPost of duePosts) {
      try {
        const publishResult = await publishSocialPostToPlatforms(socialPost, metaAccount);
        socialPost.status = "published";
        socialPost.publishResult = publishResult;
        socialPost.lastError = "";
        await socialPost.save();
        results.push({
          postId: socialPost._id,
          title: socialPost.title,
          status: "published",
        });
      } catch (error) {
        socialPost.status = "failed";
        socialPost.lastError = error.message;
        await socialPost.save();
        results.push({
          postId: socialPost._id,
          title: socialPost.title,
          status: "failed",
          error: error.message,
        });
      }
    }

    res.status(200).json({
      processedCount: results.length,
      publishedCount: results.filter((item) => item.status === "published").length,
      failedCount: results.filter((item) => item.status === "failed").length,
      queuedCount: 0,
      skippedCount: 0,
      mode: "inline",
      results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
