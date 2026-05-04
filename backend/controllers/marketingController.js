import process from "node:process";
import Blog from "../models/Blog.js";
import Campaign from "../models/Campaign.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import {
  generateCampaignSuggestion,
  repurposeBlogContent,
} from "../utils/marketingAutomation.js";
import {
  deleteAssistantKnowledgeEmbedding,
  syncAssistantKnowledgeEmbedding,
} from "../utils/pgvectorRetrieval.js";

const syncCampaignKnowledgeEmbedding = async (campaign = {}) => {
  await syncAssistantKnowledgeEmbedding(
    {
      sourceType: "campaign-entry",
      sourceId: campaign._id,
      tenantId: campaign.tenantId,
      title: campaign.title,
      body: campaign.summary,
      metadata: {
        campaignType: campaign.campaignType || "",
        status: campaign.status || "",
        channels: Array.isArray(campaign.channels) ? campaign.channels : [],
      },
    },
    process.env
  );
};

export const generateRepurposedContent = async (req, res) => {
  try {
    const { blogId } = req.body;

    if (!blogId) {
      return res.status(400).json({ message: "A blog is required to repurpose content." });
    }

    const blog = await Blog.findOne(buildTenantFilter(req, { _id: blogId }));

    if (!blog) {
      return res.status(404).json({ message: "Blog not found for this tenant." });
    }

    const repurposed = repurposeBlogContent(blog.toObject());
    res.status(200).json({
      blogId: blog._id,
      blogTitle: blog.title,
      ...repurposed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find(buildTenantFilter(req)).sort({
      scheduledFor: 1,
      updatedAt: -1,
    });
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const campaign = new Campaign(withTenantId(req, req.body));
    await campaign.save();
    await syncCampaignKnowledgeEmbedding(campaign.toObject());
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      req.body,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    await syncCampaignKnowledgeEmbedding(campaign.toObject());
    res.status(200).json(campaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete(
      buildTenantFilter(req, { _id: req.params.id })
    );

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    await deleteAssistantKnowledgeEmbedding(
      {
        sourceType: "campaign-entry",
        sourceId: campaign._id,
      },
      process.env
    );
    res.status(200).json({ message: "Campaign deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateCampaignDraft = async (req, res) => {
  try {
    const suggestion = generateCampaignSuggestion(req.body);
    res.status(200).json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
