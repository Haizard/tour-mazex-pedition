import mongoose from "mongoose";
import AccommodationReservation from "../models/AccommodationReservation.js";
import { syncAccommodationReservationRecord } from "./postgresOperationsRecords.js";
import { syncMongoDocumentToShadowStore } from "./postgresShadowWrites.js";

/**
 * Orchestrates a PostgreSQL-first write for an Accommodation Reservation.
 * Ensures relational integrity first, then shadows back to MongoDB.
 */
export const createPostgresFirstAccommodationReservation = async (payload = {}, env = globalThis.process?.env || {}) => {
  const tenantId = payload.tenantId;
  if (!tenantId) {
    throw new Error("Tenant ID is required for reservation creation.");
  }

  // 1. Generate authoritative ID
  const sharedId = payload._id || new mongoose.Types.ObjectId();
  const reservationData = {
    ...payload,
    _id: sharedId,
    updatedAt: new Date(),
    createdAt: payload.createdAt || new Date(),
  };

  // 2. PRIMARY: Write to PostgreSQL
  await syncAccommodationReservationRecord(reservationData, env);

  // 3. SECONDARY: Shadow back to MongoDB (Non-blocking resilience)
  try {
    const mongoReservation = new AccommodationReservation(reservationData);
    await mongoReservation.save();

    // 4. Update shadow metadata
    await syncMongoDocumentToShadowStore({
      entityType: "accommodation-reservations",
      document: mongoReservation.toObject(),
      model: AccommodationReservation,
      env,
    });
    return mongoReservation;
  } catch (mongoError) {
    console.error(`[ShadowWriteError] Accommodation MongoDB shadow failed for ${sharedId}:`, mongoError.message);
    return reservationData;
  }
};

/**
 * Orchestrates a PostgreSQL-first update for an Accommodation Reservation.
 */
export const updatePostgresFirstAccommodationReservation = async (
  reservationId,
  tenantId,
  updates = {},
  env = globalThis.process?.env || {}
) => {
  // 1. Fetch current state from Mongo
  const currentReservation = await AccommodationReservation.findOne({ _id: reservationId, tenantId }).lean();
  if (!currentReservation) {
    throw new Error("Reservation not found.");
  }

  const updatedData = {
    ...currentReservation,
    ...updates,
    updatedAt: new Date(),
  };

  // 2. PRIMARY: Update PostgreSQL
  await syncAccommodationReservationRecord(updatedData, env);

  // 3. SECONDARY: Update MongoDB (Non-blocking resilience)
  try {
    const mongoReservation = await AccommodationReservation.findOneAndUpdate(
      { _id: reservationId, tenantId },
      { $set: updates },
      { new: true }
    ).lean();

    if (mongoReservation) {
      // 4. Update shadow metadata
      await syncMongoDocumentToShadowStore({
        entityType: "accommodation-reservations",
        document: mongoReservation,
        model: AccommodationReservation,
        env,
      });
      return mongoReservation;
    }
    return updatedData;
  } catch (mongoError) {
    console.error(`[ShadowWriteError] Accommodation MongoDB shadow update failed for ${reservationId}:`, mongoError.message);
    return updatedData;
  }
};
