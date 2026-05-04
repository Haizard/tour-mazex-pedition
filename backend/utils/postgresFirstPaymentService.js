import mongoose from "mongoose";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { syncPaymentRevenueRecord } from "./postgresRevenueRecords.js";
import { syncMongoDocumentToShadowStore } from "./postgresShadowWrites.js";

/**
 * Orchestrates a PostgreSQL-first write for a Payment.
 * Ensures relational integrity first, then shadows back to MongoDB.
 */
export const createPostgresFirstPayment = async (payload = {}, env = globalThis.process?.env || {}) => {
  const tenantId = payload.tenantId;
  if (!tenantId) {
    throw new Error("Tenant ID is required for payment creation.");
  }

  // 1. Generate authoritative ID
  const sharedId = payload._id || new mongoose.Types.ObjectId();
  const paymentData = {
    ...payload,
    _id: sharedId,
    updatedAt: new Date(),
    createdAt: payload.createdAt || new Date(),
  };

  // 2. PRIMARY: Write to PostgreSQL
  await syncPaymentRevenueRecord(paymentData, env);

  // 3. SECONDARY: Shadow back to MongoDB
  const mongoPayment = new PaymentTransaction(paymentData);
  await mongoPayment.save();

  // 4. Update shadow metadata
  await syncMongoDocumentToShadowStore({
    entityType: "payments",
    document: mongoPayment.toObject(),
    model: PaymentTransaction,
    env,
  });

  return mongoPayment;
};

/**
 * Orchestrates a PostgreSQL-first update for a Payment.
 */
export const updatePostgresFirstPayment = async (
  paymentId,
  tenantId,
  updates = {},
  env = globalThis.process?.env || {}
) => {
  // 1. Fetch current state from Mongo
  const currentPayment = await PaymentTransaction.findOne({ _id: paymentId, tenantId }).lean();
  if (!currentPayment) {
    throw new Error("Payment not found.");
  }

  const updatedData = {
    ...currentPayment,
    ...updates,
    updatedAt: new Date(),
  };

  // 2. PRIMARY: Update PostgreSQL
  await syncPaymentRevenueRecord(updatedData, env);

  // 3. SECONDARY: Update MongoDB
  const mongoPayment = await PaymentTransaction.findOneAndUpdate(
    { _id: paymentId, tenantId },
    { $set: updates },
    { new: true }
  ).lean();

  // 4. Update shadow metadata
  await syncMongoDocumentToShadowStore({
    entityType: "payments",
    document: mongoPayment,
    model: PaymentTransaction,
    env,
  });

  return mongoPayment;
};
