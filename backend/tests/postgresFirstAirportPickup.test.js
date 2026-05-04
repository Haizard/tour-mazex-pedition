import mongoose from "mongoose";
import dotenv from "dotenv";
import { createPostgresFirstAirportPickup, updatePostgresFirstAirportPickup } from "../utils/postgresFirstAirportPickupService.js";
import AirportPickup from "../models/AirportPickup.js";
import { findAirportPickupRecord } from "../utils/postgresOperationsRecords.js";
import assert from "node:assert";

dotenv.config();

const testPostgresFirstAirportPickup = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);

  const tenantId = new mongoose.Types.ObjectId();
  
  try {
    console.log("Testing createPostgresFirstAirportPickup...");
    const payload = {
      tenantId,
      guestName: "Truth Transfer Test",
      airportCode: "JRO",
      flightNumber: "QR1357",
      pickupDateTime: new Date(),
      status: "pending",
    };

    const newPickup = await createPostgresFirstAirportPickup(payload);
    
    assert.ok(newPickup._id, "Pickup should have an ID");
    assert.strictEqual(newPickup.businessTruth.currentOwner, "postgresql", "Mongo metadata should show PostgreSQL as owner");

    console.log("Verifying in PostgreSQL...");
    const pgRecord = await findAirportPickupRecord(newPickup._id, tenantId);
    assert.ok(pgRecord, "PostgreSQL record should exist");
    assert.strictEqual(pgRecord.guest_name, "Truth Transfer Test");
    console.log("✓ Create successfully wrote to both DBs.");

    console.log("Testing updatePostgresFirstAirportPickup...");
    const updatedPickup = await updatePostgresFirstAirportPickup(newPickup._id, tenantId, {
      status: "scheduled",
      vehicleLabel: "Luxury SUV",
    });

    assert.strictEqual(updatedPickup.status, "scheduled");
    
    const pgUpdated = await findAirportPickupRecord(newPickup._id, tenantId);
    assert.strictEqual(pgUpdated.status, "scheduled");
    assert.strictEqual(pgUpdated.vehicle_label, "Luxury SUV");
    console.log("✓ Update successfully wrote to both DBs.");

  } finally {
    console.log("Cleaning up test data...");
    await AirportPickup.deleteMany({ tenantId });
    await mongoose.disconnect();
  }
};

testPostgresFirstAirportPickup().catch((err) => {
  console.error("PostgreSQL-first airport pickup test failed:", err);
  if (err.message.includes("ECONNREFUSED")) {
    console.log("Skipping full integration check due to network (expected in some environments)");
  } else {
    process.exit(1);
  }
});
