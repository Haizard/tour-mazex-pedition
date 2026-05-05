import { test } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import dotenv from "dotenv";
import MarketplacePartnership from "../models/MarketplacePartnership.js";
import { createPostgresFirstPartnership, updatePostgresFirstPartnership } from "../utils/postgresFirstPartnershipService.js";
import { createPostgresClient } from "../utils/postgresClient.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tour-mazex-pedition";

test("Partnership PostgreSQL-First Migration Test", async (t) => {
  await mongoose.connect(MONGODB_URI);
  const pgClient = createPostgresClient(process.env);
  await pgClient.connect();

  const testProviderId = "test-provider-" + Date.now();
  const testDistributorId = "test-distributor-" + Date.now();

  await t.test("should create partnership in both stores (PG-First)", async () => {
    const partnership = await createPostgresFirstPartnership({
      providerTenantId: testProviderId,
      distributorTenantId: testDistributorId,
      status: "requested",
      commissionPercent: 20,
    }, process.env);

    assert.ok(partnership._id, "Mongoose document should have an ID");
    assert.strictEqual(partnership.status, "requested");

    // Verify PG
    const pgResult = await pgClient.query(
      "SELECT * FROM public.marketplace_partnership_records WHERE provider_tenant_id = $1 AND distributor_tenant_id = $2",
      [testProviderId, testDistributorId]
    );
    assert.strictEqual(pgResult.rows.length, 1, "Should exist in PostgreSQL");
    assert.strictEqual(pgResult.rows[0].status, "requested");
    assert.strictEqual(Number(pgResult.rows[0].commission_percent), 20);
  });

  await t.test("should update partnership in both stores (PG-First)", async () => {
    await updatePostgresFirstPartnership(testProviderId, testDistributorId, {
      status: "active",
      commissionPercent: 18,
    }, process.env);

    // Verify Mongo
    const mongoUpdated = await MarketplacePartnership.findOne({ providerTenantId: testProviderId, distributorTenantId: testDistributorId });
    assert.strictEqual(mongoUpdated.status, "active");
    assert.strictEqual(mongoUpdated.commissionPercent, 18);

    // Verify PG
    const pgResult = await pgClient.query(
      "SELECT * FROM public.marketplace_partnership_records WHERE provider_tenant_id = $1 AND distributor_tenant_id = $2",
      [testProviderId, testDistributorId]
    );
    assert.strictEqual(pgResult.rows[0].status, "active");
    assert.strictEqual(Number(pgResult.rows[0].commission_percent), 18);
  });

  // Cleanup
  await MarketplacePartnership.deleteMany({ providerTenantId: testProviderId });
  await pgClient.query("DELETE FROM public.marketplace_partnership_records WHERE provider_tenant_id = $1", [testProviderId]);
  
  await pgClient.end();
  await mongoose.disconnect();
});
