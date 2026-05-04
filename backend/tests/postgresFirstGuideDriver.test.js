import mongoose from "mongoose";
import dotenv from "dotenv";
import { createPostgresFirstGuideDriverAssignment, updatePostgresFirstGuideDriverAssignment } from "../utils/postgresFirstGuideDriverService.js";
import GuideDriver from "../models/GuideDriver.js";
import { findGuideDriverAssignmentRecord } from "../utils/postgresOperationsRecords.js";
import assert from "node:assert";

dotenv.config();

const testPostgresFirstGuideDriver = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);

  const tenantId = new mongoose.Types.ObjectId();
  
  try {
    console.log("Testing createPostgresFirstGuideDriverAssignment...");
    const payload = {
      tenantId,
      fullName: "Staff Truth Test",
      staffType: "guide",
      phone: "+1234567890",
      email: "staff@truth.test",
      availabilityStatus: "available",
      languages: ["English", "Swahili"],
    };

    const newAssignment = await createPostgresFirstGuideDriverAssignment(payload);
    
    assert.ok(newAssignment._id, "Assignment should have an ID");
    assert.strictEqual(newAssignment.businessTruth.currentOwner, "postgresql", "Mongo metadata should show PostgreSQL as owner");

    console.log("Verifying in PostgreSQL...");
    const pgRecord = await findGuideDriverAssignmentRecord(newAssignment._id, tenantId);
    assert.ok(pgRecord, "PostgreSQL record should exist");
    assert.strictEqual(pgRecord.full_name, "Staff Truth Test");
    console.log("✓ Create successfully wrote to both DBs.");

    console.log("Testing updatePostgresFirstGuideDriverAssignment...");
    const updatedAssignment = await updatePostgresFirstGuideDriverAssignment(newAssignment._id, tenantId, {
      availabilityStatus: "assigned",
      assignedTourTitle: "Mt. Kilimanjaro Trek",
    });

    assert.strictEqual(updatedAssignment.availabilityStatus, "assigned");
    
    const pgUpdated = await findGuideDriverAssignmentRecord(newAssignment._id, tenantId);
    assert.strictEqual(pgUpdated.availability_status, "assigned");
    console.log("✓ Update successfully wrote to both DBs.");

  } finally {
    console.log("Cleaning up test data...");
    await GuideDriver.deleteMany({ tenantId });
    await mongoose.disconnect();
  }
};

testPostgresFirstGuideDriver().catch((err) => {
  console.error("PostgreSQL-first guide/driver test failed:", err);
  if (err.message.includes("ECONNREFUSED")) {
    console.log("Skipping full integration check due to network (expected in some environments)");
  } else {
    process.exit(1);
  }
});
