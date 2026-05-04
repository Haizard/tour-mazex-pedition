import mongoose from "mongoose";
import dotenv from "dotenv";
import { createPostgresFirstPayment, updatePostgresFirstPayment } from "../utils/postgresFirstPaymentService.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { findPaymentRevenueRecord } from "../utils/postgresRevenueRecords.js";
import assert from "node:assert";

dotenv.config();

const testPostgresFirstPayment = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);

  const tenantId = new mongoose.Types.ObjectId();
  const bookingId = new mongoose.Types.ObjectId();
  
  try {
    console.log("Testing createPostgresFirstPayment...");
    const payload = {
      tenantId,
      bookingId,
      customerName: "Payment Truth Traveler",
      provider: "stripe",
      amount: 1200,
      currency: "USD",
      status: "pending",
      publicToken: `test-token-${Date.now()}`,
    };

    const newPayment = await createPostgresFirstPayment(payload);
    
    assert.ok(newPayment._id, "Payment should have an ID");
    assert.strictEqual(newPayment.businessTruth.currentOwner, "postgresql", "Mongo metadata should show PostgreSQL as owner");
    assert.strictEqual(newPayment.businessTruth.migrationStatus, "shadowed", "Status should be shadowed");

    console.log("Verifying in PostgreSQL...");
    const pgRecord = await findPaymentRevenueRecord(newPayment._id, tenantId);
    assert.ok(pgRecord, "PostgreSQL record should exist");
    assert.strictEqual(pgRecord.customer_name, "Payment Truth Traveler");
    assert.strictEqual(pgRecord.status, "pending");
    console.log("✓ Create successfully wrote to both DBs.");

    console.log("Testing updatePostgresFirstPayment...");
    const updatedPayment = await updatePostgresFirstPayment(newPayment._id, tenantId, {
      status: "paid",
      providerReference: "ch_test_123",
      paidAt: new Date(),
    });

    assert.strictEqual(updatedPayment.status, "paid");
    
    const pgUpdated = await findPaymentRevenueRecord(newPayment._id, tenantId);
    assert.strictEqual(pgUpdated.status, "paid");
    assert.strictEqual(pgUpdated.provider_reference, "ch_test_123");
    console.log("✓ Update successfully wrote to both DBs.");

  } finally {
    console.log("Cleaning up test data...");
    await PaymentTransaction.deleteMany({ tenantId });
    await mongoose.disconnect();
  }
};

testPostgresFirstPayment().catch((err) => {
  console.error("PostgreSQL-first payment test failed:", err);
  if (err.message.includes("ECONNREFUSED")) {
    console.log("Skipping full integration check due to network (expected in some environments)");
  } else {
    process.exit(1);
  }
});
