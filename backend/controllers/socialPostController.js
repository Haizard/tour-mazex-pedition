import SocialPost from "../models/SocialPost.js";
import TourPackage from "../models/TourPackage.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import { generateSocialPostSuggestions } from "../utils/socialPostGeneration.js";

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
    const normalizedImageUrls = sanitizeImageUrls(imageUrls);
    const scheduleCheck = ensureFutureSchedule(scheduledFor);

    if (scheduleCheck?.error) {
      return res.status(400).json({ message: scheduleCheck.error });
    }

    if (status === "scheduled" && normalizedImageUrls.length === 0) {
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
        imageUrls: normalizedImageUrls,
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
      updates.imageUrls = sanitizeImageUrls(updates.imageUrls);
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
