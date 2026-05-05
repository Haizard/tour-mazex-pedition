import mongoose from "mongoose";
import MarketplacePartnership from "../models/MarketplacePartnership.js";
import { syncMarketplacePartnershipRecord } from "./postgresPartnershipRecords.js";
import { syncMongoDocumentToShadowStore } from "./postgresShadowWrites.js";

/**
 * Orchestrates a PostgreSQL-first write for a Marketplace Partnership.
 */
export const createPostgresFirstPartnership = async (payload = {}, env = globalThis.process?.env || {}) => {
  // 1. Generate authoritative ID
  const sharedId = payload._id || new mongoose.Types.ObjectId();
  const partnershipData = {
    ...payload,
    _id: sharedId,
    updatedAt: new Date(),
    createdAt: payload.createdAt || new Date(),
  };

  // 2. PRIMARY: Write to PostgreSQL
  await syncMarketplacePartnershipRecord(partnershipData, env);

  // 3. SECONDARY: Shadow back to MongoDB
  const mongoPartnership = new MarketplacePartnership(partnershipData);
  await mongoPartnership.save();

  // 4. Update shadow metadata
  await syncMongoDocumentToShadowStore({
    entityType: "partnerships",
    document: mongoPartnership.toObject(),
    model: MarketplacePartnership,
    env,
  });

  return mongoPartnership;
};

/**
 * Orchestrates a PostgreSQL-first update for a Marketplace Partnership.
 */
export const updatePostgresFirstPartnership = async (
  providerTenantId,
  distributorTenantId,
  updates = {},
  env = globalThis.process?.env || {}
) => {
  // 1. Fetch current state from Mongo
  const current = await MarketplacePartnership.findOne({ providerTenantId, distributorTenantId }).lean();
  if (!current) {
    throw new Error("Partnership not found.");
  }

  const updatedData = {
    ...current,
    ...updates,
    updatedAt: new Date(),
  };

  // 2. PRIMARY: Update PostgreSQL
  await syncMarketplacePartnershipRecord(updatedData, env);

  // 3. SECONDARY: Update MongoDB
  const mongoPartnership = await MarketplacePartnership.findOneAndUpdate(
    { providerTenantId, distributorTenantId },
    { $set: updates },
    { new: true }
  ).lean();

  // 4. Update shadow metadata
  await syncMongoDocumentToShadowStore({
    entityType: "partnerships",
    document: mongoPartnership,
    model: MarketplacePartnership,
    env,
  });

  return mongoPartnership;
};
