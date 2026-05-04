import mongoose from "mongoose";
import CustomInquiry from "../models/CustomInquiry.js";
import { syncTravelerInquiryRecord } from "./postgresTravelerInquiryRecords.js";
import { syncMongoDocumentToShadowStore } from "./postgresShadowWrites.js";

/**
 * Orchestrates a PostgreSQL-first write for a Traveler/Inquiry.
 * Ensures relational integrity first, then shadows back to MongoDB.
 */
export const createPostgresFirstTraveler = async (payload = {}, env = globalThis.process?.env || {}) => {
  const tenantId = payload.tenantId;
  if (!tenantId) {
    throw new Error("Tenant ID is required for traveler creation.");
  }

  // 1. Generate authoritative ID
  const sharedId = payload._id || new mongoose.Types.ObjectId();
  const travelerData = {
    ...payload,
    _id: sharedId,
    updatedAt: new Date(),
    createdAt: payload.createdAt || new Date(),
  };

  // 2. PRIMARY: Write to PostgreSQL
  await syncTravelerInquiryRecord(travelerData, env);

  // 3. SECONDARY: Shadow back to MongoDB
  const mongoTraveler = new CustomInquiry(travelerData);
  await mongoTraveler.save();

  // 4. Update shadow metadata
  await syncMongoDocumentToShadowStore({
    entityType: "travelers",
    document: mongoTraveler.toObject(),
    model: CustomInquiry,
    env,
  });

  return mongoTraveler;
};

/**
 * Orchestrates a PostgreSQL-first update for a Traveler/Inquiry.
 */
export const updatePostgresFirstTraveler = async (
  travelerId,
  tenantId,
  updates = {},
  env = globalThis.process?.env || {}
) => {
  // 1. Fetch current state from Mongo
  const currentTraveler = await CustomInquiry.findOne({ _id: travelerId, tenantId }).lean();
  if (!currentTraveler) {
    throw new Error("Traveler/Inquiry not found.");
  }

  const updatedData = {
    ...currentTraveler,
    ...updates,
    updatedAt: new Date(),
  };

  // 2. PRIMARY: Update PostgreSQL
  await syncTravelerInquiryRecord(updatedData, env);

  // 3. SECONDARY: Update MongoDB
  const mongoTraveler = await CustomInquiry.findOneAndUpdate(
    { _id: travelerId, tenantId },
    { $set: updates },
    { new: true }
  ).lean();

  // 4. Update shadow metadata
  await syncMongoDocumentToShadowStore({
    entityType: "travelers",
    document: mongoTraveler,
    model: CustomInquiry,
    env,
  });

  return mongoTraveler;
};
