import mongoose from "mongoose";
import dotenv from "dotenv";
import process from "node:process";
import { fileURLToPath } from "node:url";
import LeadFollowUpSequence from "../models/LeadFollowUpSequence.js";
import SocialAccount from "../models/SocialAccount.js";
import { sendWhatsAppTextMessage } from "../utils/metaGraphApi.js";
import { syncLeadFollowUpSequenceRecord } from "../utils/postgresEngagementRecords.js";
import {
  acquireFollowUpProcessingLock,
  dequeueFollowUpDispatchJob,
  drainFollowUpDispatchQueue,
  enqueueFollowUpDispatchJob,
  markFollowUpDispatchQueued,
  queueDueTouchpoints,
  releaseFollowUpProcessingLock,
} from "../utils/followUpProcessor.js";
import { getRedisClient } from "../utils/redisClient.js";

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

    const redisClient = await getRedisClient(process.env);

    for (const sequence of sequences) {
      console.log(`Queueing due touchpoints for sequence ${sequence._id}...`);
      await queueDueTouchpoints({
        sequence,
        now,
        enqueueJob: async (job) =>
          enqueueFollowUpDispatchJob({
            redisClient,
            job,
          }),
        markDispatched: async (job) =>
          markFollowUpDispatchQueued({
            redisClient,
            job,
          }),
      });
    }

    const lockAcquired = await acquireFollowUpProcessingLock({ redisClient });
    if (!lockAcquired) {
      console.log("Follow-up dispatch lock is already held. Skipping queue drain.");
      await mongoose.disconnect();
      return;
    }

    try {
      const summary = await drainFollowUpDispatchQueue({
        now,
        dequeueJob: async () =>
          dequeueFollowUpDispatchJob({
            redisClient,
          }),
        loadSequence: async (job) =>
          LeadFollowUpSequence.findById(job.sequenceId).populate("inquiryId"),
        loadChannelContext: async (sequence) => {
          const socialAccount = await SocialAccount.findOne({
            tenantId: sequence.tenantId,
            platform: "whatsapp",
          });

          if (!socialAccount) {
            return null;
          }

          return {
            phone: sequence.inquiryId?.phone || "",
            socialAccount,
          };
        },
        sendWhatsAppMessage: async ({ phone, message }, context) =>
          sendWhatsAppTextMessage(context.socialAccount, { phone, message }),
        saveSequence: async (sequence) => sequence.save(),
        syncSequence: async (sequence) =>
          syncLeadFollowUpSequenceRecord(sequence.toObject(), process.env),
      });

      console.log(`Follow-up dispatch summary: ${JSON.stringify(summary)}`);
    } finally {
      await releaseFollowUpProcessingLock({ redisClient }).catch(() => {});
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
