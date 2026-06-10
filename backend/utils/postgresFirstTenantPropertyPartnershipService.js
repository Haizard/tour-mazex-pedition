import mongoose from "mongoose";
import TenantPropertyPartnership from "../models/TenantPropertyPartnership.js";
import {
  syncTenantPropertyPartnershipRecord,
  deleteTenantPropertyPartnershipRecord,
} from "./postgresTenantPropertyPartnershipRecords.js";
import {
  syncMongoDocumentToShadowStore,
  deleteMongoDocumentFromShadowStore,
} from "./postgresShadowWrites.js";

/**
 * Orchestrates a PostgreSQL-first write for a Tenant Property Partnership.
 */
export const createPostgresFirstTenantPropertyPartnership = async (
  payload = {},
  env = globalThis.process?.env || {}
) => {
  const tenantId = payload.tenantId;
  if (!tenantId) {
    throw new Error("Tenant ID is required for partnership creation.");
  }

  // 1. Generate authoritative ID
  const sharedId = payload._id || new mongoose.Types.ObjectId();
  const partnershipData = {
    ...payload,
    _id: sharedId,
    updatedAt: new Date(),
    createdAt: payload.createdAt || new Date(),
  };

  // 2. PRIMARY: Write to PostgreSQL
  await syncTenantPropertyPartnershipRecord(partnershipData, env);

  // 3. SECONDARY: Shadow back to MongoDB
  const mongoPartnership = new TenantPropertyPartnership(partnershipData);
  await mongoPartnership.save();

  // 4. Update shadow metadata in Mongo to show PostgreSQL ownership
  await syncMongoDocumentToShadowStore({
    entityType: "tenant-property-partnerships",
    document: mongoPartnership.toObject(),
    model: TenantPropertyPartnership,
    env,
  });

  return mongoPartnership;
};

/**
 * Orchestrates a PostgreSQL-first update for a Tenant Property Partnership.
 */
export const updatePostgresFirstTenantPropertyPartnership = async (
  partnershipId,
  tenantId,
  updates = {},
  env = globalThis.process?.env || {}
) => {
  // 1. Fetch current state from Mongo
  const current = await TenantPropertyPartnership.findOne({
    _id: partnershipId,
    tenantId,
  }).lean();

  if (!current) {
    throw new Error("Partnership not found.");
  }

  const updatedData = {
    ...current,
    ...updates,
    updatedAt: new Date(),
  };

  // 2. PRIMARY: Update PostgreSQL
  await syncTenantPropertyPartnershipRecord(updatedData, env);

  // 3. SECONDARY: Update MongoDB
  const mongoPartnership = await TenantPropertyPartnership.findOneAndUpdate(
    { _id: partnershipId, tenantId },
    { $set: updates },
    { new: true }
  ).lean();

  // 4. Update shadow metadata
  await syncMongoDocumentToShadowStore({
    entityType: "tenant-property-partnerships",
    document: mongoPartnership,
    model: TenantPropertyPartnership,
    env,
  });

  return mongoPartnership;
};

/**
 * Orchestrates a PostgreSQL-first delete for a Tenant Property Partnership.
 */
export const deletePostgresFirstTenantPropertyPartnership = async (
  partnershipId,
  tenantId,
  env = globalThis.process?.env || {}
) => {
  // 1. PRIMARY: Delete from PostgreSQL
  await deleteTenantPropertyPartnershipRecord(partnershipId, tenantId, env);

  // 2. SECONDARY: Delete from MongoDB
  const partnership = await TenantPropertyPartnership.findOneAndDelete({
    _id: partnershipId,
    tenantId,
  }).lean();

  if (!partnership) {
    return null;
  }

  // 3. Remove from shadow store
  await deleteMongoDocumentFromShadowStore({
    entityType: "tenant-property-partnerships",
    sourceId: partnership._id,
  });

  return partnership;
};
