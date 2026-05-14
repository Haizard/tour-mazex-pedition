import CustomInquiry from "../models/CustomInquiry.js";
import SocialAccount from "../models/SocialAccount.js";
import SocialPost from "../models/SocialPost.js";
import {
  sendWhatsAppTextMessage,
  verifyMetaAccountConnection,
} from "../utils/metaGraphApi.js";
import { resolveSocialPublishingReadiness } from "../utils/socialPublishingReadiness.js";
import { publishSocialPostToPlatforms } from "../utils/socialAutomation.js";
import { buildWhatsAppAutomationSnapshot } from "../utils/unifiedInbox.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const normalizeSocialAccountPayload = (body = {}) => ({
  provider: body.provider,
  label: body.label?.trim(),
  status: body.status || "draft",
  accessToken: body.accessToken?.trim(),
  pageId: body.pageId?.trim() || "",
  instagramBusinessAccountId: body.instagramBusinessAccountId?.trim() || "",
  whatsappBusinessAccountId: body.whatsappBusinessAccountId?.trim() || "",
  whatsappPhoneNumberId: body.whatsappPhoneNumberId?.trim() || "",
  phoneNumber: body.phoneNumber?.trim() || "",
  metadata: body.metadata || {},
});

export const getSocialAccounts = async (req, res) => {
  try {
    const accounts = await SocialAccount.find(buildTenantFilter(req)).sort({
      createdAt: -1,
    });
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSocialAccount = async (req, res) => {
  try {
    const account = new SocialAccount(
      withTenantId(req, normalizeSocialAccountPayload(req.body))
    );
    await account.save();
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSocialAccount = async (req, res) => {
  try {
    const account = await SocialAccount.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      normalizeSocialAccountPayload(req.body),
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Social account not found." });
    }

    res.status(200).json(account);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSocialAccount = async (req, res) => {
  try {
    const account = await SocialAccount.findOneAndDelete(
      buildTenantFilter(req, { _id: req.params.id })
    );

    if (!account) {
      return res.status(404).json({ message: "Social account not found." });
    }

    res.status(200).json({ message: "Social account deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifySocialAccount = async (req, res) => {
  try {
    const account = await SocialAccount.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    );

    if (!account) {
      return res.status(404).json({ message: "Social account not found." });
    }

    let verification = null;

    if (account.provider === "meta") {
      verification = await verifyMetaAccountConnection(account);
    } else {
      verification = { ok: true, provider: "whatsapp" };
    }

    account.status = "active";
    account.lastVerifiedAt = new Date();
    account.lastError = "";
    await account.save();

    res.status(200).json({ account, verification });
  } catch (error) {
    const account = await SocialAccount.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    );
    if (account) {
      account.status = "error";
      account.lastError = error.message;
      await account.save();
    }
    res.status(400).json({ message: error.message });
  }
};

export const publishSocialPostLive = async (req, res) => {
  try {
    const socialPost = await SocialPost.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    );

    if (!socialPost) {
      return res.status(404).json({ message: "Social post not found." });
    }

    const accounts = await SocialAccount.find(buildTenantFilter(req)).lean();
    const readiness = resolveSocialPublishingReadiness({
      accounts,
      platforms: socialPost.platforms || [],
    });

    if (!readiness.ready || !readiness.account) {
      return res.status(400).json({
        message: readiness.message || "Connect an active Meta account before publishing live.",
        readiness,
      });
    }

    const publishResult = await publishSocialPostToPlatforms(socialPost, readiness.account);

    socialPost.status = "published";
    socialPost.publishResult = publishResult;
    socialPost.lastError = "";
    await socialPost.save();

    res.status(200).json(socialPost);
  } catch (error) {
    const socialPost = await SocialPost.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    );
    if (socialPost) {
      socialPost.status = "failed";
      socialPost.lastError = error.message;
      await socialPost.save();
    }
    res.status(400).json({ message: error.message });
  }
};

export const sendInquiryWhatsAppMessage = async (req, res) => {
  try {
    const inquiry = await CustomInquiry.findOne(
      buildTenantFilter(req, { _id: req.params.id })
    );

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found." });
    }

    const whatsappAccount = await SocialAccount.findOne(
      buildTenantFilter(req, { provider: "whatsapp", status: "active" })
    );

    if (!whatsappAccount) {
      return res.status(400).json({
        message: "Connect an active WhatsApp Business account before sending.",
      });
    }

    const message =
      req.body.message?.trim() ||
      inquiry.followUpMessage ||
      inquiry.automationSummary ||
      inquiry.message;

    const result = await sendWhatsAppTextMessage(whatsappAccount, {
      phone: inquiry.phone,
      message,
    });

    inquiry.status = "Contacted";
    inquiry.leadStage = "follow-up";
    inquiry.whatsappAutomation = buildWhatsAppAutomationSnapshot(
      inquiry.whatsappAutomation || {},
      {
        message,
        externalMessageId: result?.messages?.[0]?.id || "",
        status: "sent",
        sentAt: new Date().toISOString(),
      }
    );
    await inquiry.save();

    res.status(200).json({
      inquiry,
      result,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
