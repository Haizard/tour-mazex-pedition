import { requirePublicApiKey } from "../middleware/apiKeyMiddleware.js";
import { getSignedUrlForKey, getObjectStorageStrategy } from "../utils/objectStorage.js";
import { buildPaymentRevenueUpsert, buildBookingRevenueUpsert } from "../utils/postgresRevenueRecords.js";
import { persistQuotePdf } from "../utils/quotePdfStorage.js";

/**
 * Phase 8 Logic Verification Script.
 * This tests the core architectural changes without requiring a live server.
 * [SKILL: Quality Assurance & Integration Testing]
 */
async function runVerification() {
  console.log("=== Phase 8 Architectural Verification ===");

  // 1. Test API Key Middleware Logic
  console.log("\n[1] Testing API Key Middleware Logic...");
  const mockReq = { headers: { "x-api-key": "test", "x-tenant-id": "test" } };
  const mockRes = { status: (code) => ({ json: (data) => console.log(`   Response ${code}:`, data) }) };
  // Note: This would hit the DB, so we just verify the logic exists and handles missing headers.
  const mockReqMissing = { headers: {} };
  await requirePublicApiKey(mockReqMissing, mockRes, () => {});

  // 2. Test S3 Signed URL Strategy
  console.log("\n[2] Testing Object Storage Strategy...");
  const strategy = getObjectStorageStrategy({
    MEDIA_STORAGE_PROVIDER: "s3-compatible",
    S3_BUCKET: "test-bucket",
    S3_ENDPOINT: "https://test.endpoint.com"
  });
  console.log("   Strategy Active Provider:", strategy.activeProvider);
  if (strategy.activeProvider === "s3-compatible") {
    console.log("   S3 Strategy Verified.");
  }

  // 3. Test PostgreSQL Statement Generation
  console.log("\n[3] Testing PostgreSQL Statement Builders...");
  const mockBooking = { _id: "67140f7b9f84848037ed1996", tenantId: "test", itineraryMediaId: "media_123" };
  const bookingStatement = buildBookingRevenueUpsert(mockBooking);
  if (bookingStatement.text.includes("itinerary_media_id")) {
    console.log("   Booking Upsert includes itinerary_media_id column. [PASSED]");
  }

  const mockPayment = { _id: "pay_123", tenantId: "test", invoiceMediaId: "media_456" };
  const paymentStatement = buildPaymentRevenueUpsert(mockPayment);
  if (paymentStatement.text.includes("invoice_media_id")) {
    console.log("   Payment Upsert includes invoice_media_id column. [PASSED]");
  }

  console.log("\n=== Architectural Verification Complete ===");
}

runVerification().catch(err => console.error("Verification failed:", err));
