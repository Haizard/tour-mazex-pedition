import mongoose from "mongoose";
import dotenv from "dotenv";
import LeadFollowUpSequence from "../models/LeadFollowUpSequence.js";
import SocialAccount from "../models/SocialAccount.js";
import { sendWhatsAppTextMessage } from "../utils/metaGraphApi.js";

dotenv.config();

const processFollowUps = async () => {
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

      for (const tp of sequence.touchpoints) {
        if (tp.status === "pending" && tp.scheduledAt <= now) {
          try {
            console.log(`Sending follow-up to ${sequence.inquiryId?.phone || "unknown"}...`);
            
            if (tp.channel === "whatsapp" && sequence.inquiryId?.phone) {
              await sendWhatsAppTextMessage(socialAccount, {
                phone: sequence.inquiryId.phone,
                message: tp.content,
              });
            } else {
              // Fallback or other channels (email etc)
              console.log(`Channel ${tp.channel} not fully automated yet or missing phone.`);
            }

            tp.status = "sent";
            tp.sentAt = new Date();
          } catch (error) {
            console.error(`Failed to send touchpoint for sequence ${sequence._id}:`, error.message);
            tp.status = "failed";
          }
        }
      }

      await sequence.save();
    }

    console.log("Follow-up processing complete.");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Critical error in processFollowUps:", error);
    process.exit(1);
  }
};

processFollowUps();
