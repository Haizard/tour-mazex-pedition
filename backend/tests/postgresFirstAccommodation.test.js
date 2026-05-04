import mongoose from "mongoose";
import dotenv from "dotenv";
import { createPostgresFirstAccommodationReservation, updatePostgresFirstAccommodationReservation } from "../utils/postgresFirstAccommodationService.js";
import AccommodationReservation from "../models/AccommodationReservation.js";
import { findAccommodationReservationRecord } from "../utils/postgresOperationsRecords.js";
import assert from "node:assert";

dotenv.config();

const testPostgresFirstAccommodation = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);

  const tenantId = new mongoose.Types.ObjectId();
  
  try {
    console.log("Testing createPostgresFirstAccommodationReservation...");
    const payload = {
      tenantId,
      hotelName: "Truth Hotel & Spa",
      supplierName: "Truth Supplies",
      checkInDate: new Date(),
      guestCount: 2,
      status: "pending",
    };

    const newReservation = await createPostgresFirstAccommodationReservation(payload);
    
    assert.ok(newReservation._id, "Reservation should have an ID");
    assert.strictEqual(newReservation.businessTruth.currentOwner, "postgresql", "Mongo metadata should show PostgreSQL as owner");

    console.log("Verifying in PostgreSQL...");
    const pgRecord = await findAccommodationReservationRecord(newReservation._id, tenantId);
    assert.ok(pgRecord, "PostgreSQL record should exist");
    assert.strictEqual(pgRecord.hotel_name, "Truth Hotel & Spa");
    console.log("✓ Create successfully wrote to both DBs.");

    console.log("Testing updatePostgresFirstAccommodationReservation...");
    const updatedReservation = await updatePostgresFirstAccommodationReservation(newReservation._id, tenantId, {
      status: "confirmed",
      reservationCode: "TRUTH-123",
    });

    assert.strictEqual(updatedReservation.status, "confirmed");
    
    const pgUpdated = await findAccommodationReservationRecord(newReservation._id, tenantId);
    assert.strictEqual(pgUpdated.status, "confirmed");
    assert.strictEqual(pgUpdated.reservation_code, "TRUTH-123");
    console.log("✓ Update successfully wrote to both DBs.");

  } finally {
    console.log("Cleaning up test data...");
    await AccommodationReservation.deleteMany({ tenantId });
    await mongoose.disconnect();
  }
};

testPostgresFirstAccommodation().catch((err) => {
  console.error("PostgreSQL-first accommodation test failed:", err);
  if (err.message.includes("ECONNREFUSED")) {
    console.log("Skipping full integration check due to network (expected in some environments)");
  } else {
    process.exit(1);
  }
});
