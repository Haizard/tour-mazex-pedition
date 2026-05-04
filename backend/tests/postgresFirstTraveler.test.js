import mongoose from "mongoose";
import dotenv from "dotenv";
import { createPostgresFirstTraveler, updatePostgresFirstTraveler } from "../utils/postgresFirstTravelerService.js";
import CustomInquiry from "../models/CustomInquiry.js";
import { findTravelerInquiryRecord } from "../utils/postgresTravelerInquiryRecords.js";
import assert from "node:assert";

dotenv.config();

const testPostgresFirstTraveler = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);

  const tenantId = new mongoose.Types.ObjectId();
  
  try {
    console.log("Testing createPostgresFirstTraveler...");
    const payload = {
      tenantId,
      name: "Traveler Truth Test",
      email: "traveler@truth.test",
      phone: "+1234567890",
      destinations: ["Tanzania"],
      tripLengthDays: 7,
      adults: 2,
      status: "new",
      leadStage: "lead",
      leadTemperature: "warm",
    };

    const newTraveler = await createPostgresFirstTraveler(payload);
    
    assert.ok(newTraveler._id, "Traveler should have an ID");
    assert.strictEqual(newTraveler.businessTruth.currentOwner, "postgresql", "Mongo metadata should show PostgreSQL as owner");

    console.log("Verifying in PostgreSQL...");
    const pgRecord = await findTravelerInquiryRecord(newTraveler._id, tenantId);
    assert.ok(pgRecord, "PostgreSQL record should exist");
    assert.strictEqual(pgRecord.name, "Traveler Truth Test");
    console.log("✓ Create successfully wrote to both DBs.");

    console.log("Testing updatePostgresFirstTraveler...");
    const updatedTraveler = await updatePostgresFirstTraveler(newTraveler._id, tenantId, {
      leadStage: "qualified",
      leadTemperature: "hot",
    });

    assert.strictEqual(updatedTraveler.leadStage, "qualified");
    
    const pgUpdated = await findTravelerInquiryRecord(newTraveler._id, tenantId);
    assert.strictEqual(pgUpdated.lead_stage, "qualified");
    console.log("✓ Update successfully wrote to both DBs.");

  } finally {
    console.log("Cleaning up test data...");
    await CustomInquiry.deleteMany({ tenantId });
    await mongoose.disconnect();
  }
};

testPostgresFirstTraveler().catch((err) => {
  console.error("PostgreSQL-first traveler test failed:", err);
  if (err.message.includes("ECONNREFUSED")) {
    console.log("Skipping full integration check due to network (expected in some environments)");
  } else {
    process.exit(1);
  }
});
