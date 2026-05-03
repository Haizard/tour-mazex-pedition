import mongoose from "mongoose";
import dotenv from "dotenv";
import process from "node:process";
import { fileURLToPath } from "node:url";
import LeadFollowUpSequence from "../models/LeadFollowUpSequence.js";
import SocialAccount from "../models/SocialAccount.js";
import { sendWhatsAppTextMessage } from "../utils/metaGraphApi.js";
import { syncLeadFollowUpSequenceRecord } from "../utils/postgresEngagementRecords.js";
import { processDueTouchpoints } from "../utils/followUpProcessor.js";

dotenv.config();

export const processFollowUps = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Processing automated follow-ups...");

    const now = new Date();

    // Find active sequences with pending touchpoints due now
    const sequences = await LeadFollowUpSequence.find({
      status: "active",
      "touchpoints.status": "pending",
      "touchpoints.scheduledAt": { $lte: now },
    }).populate("inquiryId");

    console.log(`Found ${sequences.length} active sequences to process.`);

    for (const sequence of sequences) {
      // Find the social account for WhatsApp credentials
      const socialAccount = await SocialAccount.findOne({
        tenantId: sequence.tenantId,
        platform: "whatsapp",
      });

      if (!socialAccount) {
        console.error(`No WhatsApp account found for tenant ${sequence.tenantId}`);
        continue;
      }

      console.log(`Processing follow-up sequence ${sequence._id} for ${sequence.inquiryId?.phone || "unknown"}...`);

      const { changed } = await processDueTouchpoints({
        sequence,
        now,
        sendWhatsAppMessage: ({ phone, message }) =>
          sendWhatsAppTextMessage(socialAccount, { phone, message }),
      });

      if (!changed) {
        continue;
      }

      await sequence.save();
      await syncLeadFollowUpSequenceRecord(sequence.toObject(), process.env);
    }

    console.log("Follow-up processing complete.");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Critical error in processFollowUps:", error);
    process.exit(1);
  }
};

const currentFilePath = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1] && currentFilePath === process.argv[1];

if (isDirectRun) {
  processFollowUps();
}
