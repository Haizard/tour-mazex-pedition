import mongoose from "mongoose";
import GuideDriver from "../models/GuideDriver.js";
import { syncGuideDriverAssignmentRecord } from "./postgresOperationsRecords.js";
import { syncMongoDocumentToShadowStore } from "./postgresShadowWrites.js";

/**
 * Orchestrates a PostgreSQL-first write for a Guide/Driver Assignment.
 * Ensures relational integrity first, then shadows back to MongoDB.
 */
export const createPostgresFirstGuideDriverAssignment = async (payload = {}, env = globalThis.process?.env || {}) => {
  const tenantId = payload.tenantId;
  if (!tenantId) {
    throw new Error("Tenant ID is required for assignment creation.");
  }

  // 1. Generate authoritative ID
  const sharedId = payload._id || new mongoose.Types.ObjectId();
  const assignmentData = {
    ...payload,
    _id: sharedId,
    updatedAt: new Date(),
    createdAt: payload.createdAt || new Date(),
  };

  // 2. PRIMARY: Write to PostgreSQL
  await syncGuideDriverAssignmentRecord(assignmentData, env);

  // 3. SECONDARY: Shadow back to MongoDB (Non-blocking resilience)
  try {
    const mongoAssignment = new GuideDriver(assignmentData);
    await mongoAssignment.save();

    // 4. Update shadow metadata
    await syncMongoDocumentToShadowStore({
      entityType: "guide-driver-assignments",
      document: mongoAssignment.toObject(),
      model: GuideDriver,
      env,
    });
    return mongoAssignment;
  } catch (mongoError) {
    console.error(`[ShadowWriteError] Guide/Driver MongoDB shadow failed for ${sharedId}:`, mongoError.message);
    // Return a plain object that mimics the model for the response, since PG write succeeded
    return assignmentData;
  }
};

/**
 * Orchestrates a PostgreSQL-first update for a Guide/Driver Assignment.
 */
export const updatePostgresFirstGuideDriverAssignment = async (
  assignmentId,
  tenantId,
  updates = {},
  env = globalThis.process?.env || {}
) => {
  // 1. Fetch current state from Mongo
  const currentAssignment = await GuideDriver.findOne({ _id: assignmentId, tenantId }).lean();
  if (!currentAssignment) {
    throw new Error("Assignment not found.");
  }

  const updatedData = {
    ...currentAssignment,
    ...updates,
    updatedAt: new Date(),
  };

  // 2. PRIMARY: Update PostgreSQL
  await syncGuideDriverAssignmentRecord(updatedData, env);

  // 3. SECONDARY: Update MongoDB (Non-blocking resilience)
  try {
    const mongoAssignment = await GuideDriver.findOneAndUpdate(
      { _id: assignmentId, tenantId },
      { $set: updates },
      { new: true }
    ).lean();

    if (mongoAssignment) {
      // 4. Update shadow metadata
      await syncMongoDocumentToShadowStore({
        entityType: "guide-driver-assignments",
        document: mongoAssignment,
        model: GuideDriver,
        env,
      });
      return mongoAssignment;
    }
    return updatedData;
  } catch (mongoError) {
    console.error(`[ShadowWriteError] Guide/Driver MongoDB shadow update failed for ${assignmentId}:`, mongoError.message);
    return updatedData;
  }
};
