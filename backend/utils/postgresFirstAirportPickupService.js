import mongoose from "mongoose";
import AirportPickup from "../models/AirportPickup.js";
import { syncAirportPickupRecord } from "./postgresOperationsRecords.js";
import { syncMongoDocumentToShadowStore } from "./postgresShadowWrites.js";

/**
 * Orchestrates a PostgreSQL-first write for an Airport Pickup.
 * Ensures relational integrity first, then shadows back to MongoDB.
 */
export const createPostgresFirstAirportPickup = async (payload = {}, env = globalThis.process?.env || {}) => {
  const tenantId = payload.tenantId;
  if (!tenantId) {
    throw new Error("Tenant ID is required for pickup creation.");
  }

  // 1. Generate authoritative ID
  const sharedId = payload._id || new mongoose.Types.ObjectId();
  const pickupData = {
    ...payload,
    _id: sharedId,
    updatedAt: new Date(),
    createdAt: payload.createdAt || new Date(),
  };

  // 2. PRIMARY: Write to PostgreSQL
  await syncAirportPickupRecord(pickupData, env);

  // 3. SECONDARY: Shadow back to MongoDB (Non-blocking resilience)
  try {
    const mongoPickup = new AirportPickup(pickupData);
    await mongoPickup.save();

    // 4. Update shadow metadata
    await syncMongoDocumentToShadowStore({
      entityType: "airport-pickups",
      document: mongoPickup.toObject(),
      model: AirportPickup,
      env,
    });
    return mongoPickup;
  } catch (mongoError) {
    console.error(`[ShadowWriteError] Airport Pickup MongoDB shadow failed for ${sharedId}:`, mongoError.message);
    return pickupData;
  }
};

/**
 * Orchestrates a PostgreSQL-first update for an Airport Pickup.
 */
export const updatePostgresFirstAirportPickup = async (
  pickupId,
  tenantId,
  updates = {},
  env = globalThis.process?.env || {}
) => {
  // 1. Fetch current state from Mongo
  const currentPickup = await AirportPickup.findOne({ _id: pickupId, tenantId }).lean();
  if (!currentPickup) {
    throw new Error("Airport pickup not found.");
  }

  const updatedData = {
    ...currentPickup,
    ...updates,
    updatedAt: new Date(),
  };

  // 2. PRIMARY: Update PostgreSQL
  await syncAirportPickupRecord(updatedData, env);

  // 3. SECONDARY: Update MongoDB (Non-blocking resilience)
  try {
    const mongoPickup = await AirportPickup.findOneAndUpdate(
      { _id: pickupId, tenantId },
      { $set: updates },
      { new: true }
    ).lean();

    if (mongoPickup) {
      // 4. Update shadow metadata
      await syncMongoDocumentToShadowStore({
        entityType: "airport-pickups",
        document: mongoPickup,
        model: AirportPickup,
        env,
      });
      return mongoPickup;
    }
    return updatedData;
  } catch (mongoError) {
    console.error(`[ShadowWriteError] Airport Pickup MongoDB shadow update failed for ${pickupId}:`, mongoError.message);
    return updatedData;
  }
};
