import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import { syncBookingRevenueRecord } from "./postgresRevenueRecords.js";
import { syncMongoDocumentToShadowStore } from "./postgresShadowWrites.js";

/**
 * Orchestrates a PostgreSQL-first write for a Booking.
 * Ensures relational integrity first, then shadows back to MongoDB.
 */
export const createPostgresFirstBooking = async (payload = {}, env = globalThis.process?.env || {}) => {
  const tenantId = payload.tenantId;
  if (!tenantId) {
    throw new Error("Tenant ID is required for booking creation.");
  }

  // 1. Generate authoritative ID (Mongo-compatible for legacy bridging)
  const sharedId = payload._id || new mongoose.Types.ObjectId();
  const bookingData = {
    ...payload,
    _id: sharedId,
  };

  // 2. PRIMARY: Write to PostgreSQL
  // Note: syncBookingRevenueRecord handles upsert logic in public.booking_records
  await syncBookingRevenueRecord(bookingData, env);

  // 3. SECONDARY: Shadow back to MongoDB
  const mongoBooking = new Booking(bookingData);
  await mongoBooking.save();

  // 4. Update shadow metadata in Mongo to show PostgreSQL ownership
  await syncMongoDocumentToShadowStore({
    entityType: "bookings",
    document: mongoBooking.toObject(),
    model: Booking,
    env,
  });

  return mongoBooking;
};

/**
 * Orchestrates a PostgreSQL-first update for a Booking.
 */
export const updatePostgresFirstBooking = async (
  bookingId,
  tenantId,
  updates = {},
  env = globalThis.process?.env || {}
) => {
  // 1. Fetch current state from Mongo (temporary until reads are fully shifted)
  const currentBooking = await Booking.findOne({ _id: bookingId, tenantId }).lean();
  if (!currentBooking) {
    throw new Error("Booking not found.");
  }

  const updatedData = {
    ...currentBooking,
    ...updates,
    updatedAt: new Date(),
  };

  // 2. PRIMARY: Update PostgreSQL
  await syncBookingRevenueRecord(updatedData, env);

  // 3. SECONDARY: Update MongoDB
  const mongoBooking = await Booking.findOneAndUpdate(
    { _id: bookingId, tenantId },
    { $set: updates },
    { new: true }
  ).lean();

  // 4. Update shadow metadata
  await syncMongoDocumentToShadowStore({
    entityType: "bookings",
    document: mongoBooking,
    model: Booking,
    env,
  });

  return mongoBooking;
};
