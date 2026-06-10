import { test } from "node:test";
import assert from "node:assert";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createPostgresClient } from "../utils/postgresClient.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NETWORK_SKIP_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"]);

const shouldSkipForNetwork = (error) => {
  if (!error) return false;
  return (
    NETWORK_SKIP_CODES.has(error.code) ||
    /ECONNREFUSED|ENOTFOUND|EAI_AGAIN|querySrv/i.test(error.message || "")
  );
};

// ── Test 1: Tenant Property Partnership table creation migration ────────────

test("Tenant Property Partnership Migration applies cleanly", async (t) => {
  const pgClient = createPostgresClient(process.env);
  try {
    await pgClient.connect();
  } catch (error) {
    if (shouldSkipForNetwork(error)) {
      t.diagnostic("Skipping migration test - PostgreSQL network not available");
      return;
    }
    throw error;
  }

  const migrationPath = path.resolve(__dirname, "../../supabase/migrations/20260610090000_create_tenant_property_partnerships.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf8");

  try {
    await t.test("migration SQL file exists and is non-empty", () => {
      assert.ok(migrationSql);
      assert.ok(migrationSql.includes("create table"));
      assert.ok(migrationSql.includes("tenant_property_partnerships"));
      assert.ok(migrationSql.includes("source_id text primary key"));
    });

    await t.test("migration applies without error (idempotent)", async () => {
      await pgClient.query(migrationSql);
      await pgClient.query(migrationSql);
    });

    await t.test("table exists after migration", async () => {
      const r = await pgClient.query("select exists (select from information_schema.tables where table_schema='public' and table_name='tenant_property_partnerships') as e");
      assert.strictEqual(r.rows[0].e, true);
    });

    await t.test("table has expected columns", async () => {
      const r = await pgClient.query("select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='tenant_property_partnerships' order by ordinal_position");
      const cols = r.rows.reduce((a, r) => { a[r.column_name] = { dt: r.data_type, nu: r.is_nullable }; return a; }, {});
      assert.strictEqual(cols.source_id?.dt, "text");
      assert.strictEqual(cols.source_id?.nu, "NO");
      assert.strictEqual(cols.tenant_id?.dt, "text");
      assert.strictEqual(cols.tenant_id?.nu, "NO");
      assert.strictEqual(cols.property_type?.dt, "text");
      assert.strictEqual(cols.commission_percent?.dt, "numeric");
      assert.strictEqual(cols.owner_tenant_id?.nu, "YES");
      assert.strictEqual(cols.source_payload?.dt, "jsonb");
      assert.strictEqual(cols.created_at?.dt, "timestamp with time zone");
    });

    await t.test("indexes are created", async () => {
      const r = await pgClient.query("select indexname from pg_indexes where schemaname='public' and tablename='tenant_property_partnerships'");
      const names = r.rows.map(r => r.indexname);
      assert.ok(names.some(n => n.includes("pkey")));
      assert.ok(names.includes("tenant_property_partnerships_tenant_idx"));
      assert.ok(names.includes("tenant_property_partnerships_property_idx"));
    });

    await t.test("can insert and read a row", async () => {
      const id = "test-mig-" + Date.now();
      await pgClient.query("insert into public.tenant_property_partnerships (source_id, tenant_id, property_type, commission_percent, status, source_payload) values ($1,$2,$3,$4,$5,$6::jsonb)", [id, "t-a", "restaurant", 12.5, "active", JSON.stringify({ a: 1 })]);
      const row = (await pgClient.query("select * from public.tenant_property_partnerships where source_id=$1", [id])).rows[0];
      assert.strictEqual(row.source_id, id);
      assert.strictEqual(row.property_type, "restaurant");
      assert.strictEqual(Number(row.commission_percent), 12.5);
      await pgClient.query("delete from public.tenant_property_partnerships where source_id=$1", [id]);
    });

    await t.test("defaults are set correctly", async () => {
      const id = "test-def-" + Date.now();
      await pgClient.query("insert into public.tenant_property_partnerships (source_id, tenant_id) values ($1,$2)", [id, "t-d"]);
      const row = (await pgClient.query("select * from public.tenant_property_partnerships where source_id=$1", [id])).rows[0];
      assert.strictEqual(row.status, "active");
      assert.strictEqual(Number(row.commission_percent), 0);
      assert.deepStrictEqual(row.source_payload, {});
      assert.strictEqual(row.owner_tenant_id, null);
      await pgClient.query("delete from public.tenant_property_partnerships where source_id=$1", [id]);
    });

    await t.test("unique constraint on source_id", async () => {
      const id = "test-uniq-" + Date.now();
      await pgClient.query("insert into public.tenant_property_partnerships (source_id, tenant_id) values ($1,$2)", [id, "t1"]);
      try {
        await pgClient.query("insert into public.tenant_property_partnerships (source_id, tenant_id) values ($1,$2)", [id, "t2"]);
        assert.fail("should reject duplicate");
      } catch (e) {
        assert.ok(/duplicate key|unique constraint|violates/i.test(e.message));
      }
      await pgClient.query("delete from public.tenant_property_partnerships where source_id=$1", [id]);
    });

    await t.test("upsert works", async () => {
      const id = "test-ups-" + Date.now();
      await pgClient.query("insert into public.tenant_property_partnerships (source_id, tenant_id, status) values ($1,$2,$3)", [id, "t-u", "active"]);
      await pgClient.query("insert into public.tenant_property_partnerships (source_id, tenant_id, status) values ($1,$2,$3) on conflict (source_id) do update set status=excluded.status, updated_at=now()", [id, "t-u", "suspended"]);
      const row = (await pgClient.query("select * from public.tenant_property_partnerships where source_id=$1", [id])).rows[0];
      assert.strictEqual(row.status, "suspended");
      await pgClient.query("delete from public.tenant_property_partnerships where source_id=$1", [id]);
    });
  } finally {
    await pgClient.query("drop table if exists public.tenant_property_partnerships cascade").catch(() => {});
    await pgClient.end().catch(() => {});
  }
});

// ── Test 2: Missing commission columns migration on payment_records / booking_records ─

test("Missing Commission Columns Migration applies cleanly", async (t) => {
  const pgClient = createPostgresClient(process.env);
  try {
    await pgClient.connect();
  } catch (error) {
    if (shouldSkipForNetwork(error)) {
      t.diagnostic("Skipping commission columns migration test - PostgreSQL not available");
      return;
    }
    throw error;
  }

  const migrationPath = path.resolve(__dirname, "../../supabase/migrations/20260610100000_add_missing_commission_columns.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf8");

  try {
    await pgClient.query("create table if not exists public.payment_records (source_id text primary key, tenant_id text not null default '')");
    await pgClient.query("create table if not exists public.booking_records (source_id text primary key, tenant_id text not null default '')");

    await t.test("migration SQL file exists", () => {
      assert.ok(migrationSql);
      assert.ok(migrationSql.includes("add column"));
      assert.ok(migrationSql.includes("marketplace_payout_amount"));
      assert.ok(migrationSql.includes("distributor_tenant_id"));
    });

    await t.test("migration applies idempotently", async () => {
      await pgClient.query(migrationSql);
      await pgClient.query(migrationSql);
    });

    await t.test("payment_records columns", async () => {
      const r = await pgClient.query("select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name='payment_records' order by ordinal_position");
      const cols = r.rows.reduce((a, r) => { a[r.column_name] = { dt: r.data_type, nu: r.is_nullable, def: r.column_default }; return a; }, {});
      assert.strictEqual(cols.invoice_media_id?.dt, "text");
      assert.strictEqual(cols.invoice_media_id?.nu, "YES");
      assert.strictEqual(cols.marketplace_payout_amount?.dt, "numeric");
      assert.strictEqual(cols.marketplace_payout_amount?.nu, "NO");
      assert.ok(cols.marketplace_payout_amount?.def?.includes("0"));
      assert.strictEqual(cols.checkout_kind?.dt, "text");
      assert.strictEqual(cols.checkout_kind?.nu, "NO");
    });

    await t.test("booking_records columns", async () => {
      const r = await pgClient.query("select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name='booking_records' order by ordinal_position");
      const cols = r.rows.reduce((a, r) => { a[r.column_name] = { dt: r.data_type, nu: r.is_nullable, def: r.column_default }; return a; }, {});
      assert.strictEqual(cols.itinerary_media_id?.dt, "text");
      assert.strictEqual(cols.itinerary_media_id?.nu, "YES");
      assert.strictEqual(cols.distributor_tenant_id?.dt, "text");
      assert.strictEqual(cols.distributor_tenant_id?.nu, "YES");
      assert.strictEqual(cols.marketplace_commission_percent?.dt, "numeric");
      assert.strictEqual(cols.marketplace_commission_percent?.nu, "NO");
      assert.ok(cols.marketplace_commission_percent?.def?.includes("0"));
    });

    await t.test("indexes", async () => {
      const pi = await pgClient.query("select indexdef from pg_indexes where schemaname='public' and tablename='payment_records' and indexname='payment_records_payout_idx'");
      assert.strictEqual(pi.rows.length, 1);
      assert.ok(pi.rows[0].indexdef.includes("marketplace_payout_amount"));
      const bi = await pgClient.query("select indexdef from pg_indexes where schemaname='public' and tablename='booking_records' and indexname='booking_records_distributor_idx'");
      assert.strictEqual(bi.rows.length, 1);
      assert.ok(bi.rows[0].indexdef.includes("distributor_tenant_id"));
    });

    await t.test("insert/read with new columns", async () => {
      const pid = "test-col-pay-" + Date.now();
      await pgClient.query("insert into public.payment_records (source_id, tenant_id, marketplace_payout_amount, checkout_kind, invoice_media_id) values ($1,$2,$3,$4,$5)", [pid, "t1", 42.5, "restaurant", "inv-abc"]);
      const pr = (await pgClient.query("select * from public.payment_records where source_id=$1", [pid])).rows[0];
      assert.strictEqual(Number(pr.marketplace_payout_amount), 42.5);
      assert.strictEqual(pr.checkout_kind, "restaurant");
      assert.strictEqual(pr.invoice_media_id, "inv-abc");
      await pgClient.query("delete from public.payment_records where source_id=$1", [pid]);

      const bid = "test-col-book-" + Date.now();
      await pgClient.query("insert into public.booking_records (source_id, tenant_id, itinerary_media_id, distributor_tenant_id, marketplace_commission_percent) values ($1,$2,$3,$4,$5)", [bid, "t2", "itin-123", "dist-999", 15.0]);
      const br = (await pgClient.query("select * from public.booking_records where source_id=$1", [bid])).rows[0];
      assert.strictEqual(br.itinerary_media_id, "itin-123");
      assert.strictEqual(br.distributor_tenant_id, "dist-999");
      assert.strictEqual(Number(br.marketplace_commission_percent), 15.0);
      await pgClient.query("delete from public.booking_records where source_id=$1", [bid]);
    });

    await t.test("defaults", async () => {
      const id = "test-col-def-" + Date.now();
      await pgClient.query("insert into public.payment_records (source_id, tenant_id) values ($1,$2)", [id + "-p", "t-d"]);
      const pr = (await pgClient.query("select * from public.payment_records where source_id=$1", [id + "-p"])).rows[0];
      assert.strictEqual(Number(pr.marketplace_payout_amount), 0);
      assert.strictEqual(pr.checkout_kind, "");
      assert.strictEqual(pr.invoice_media_id, null);

      await pgClient.query("insert into public.booking_records (source_id, tenant_id) values ($1,$2)", [id + "-b", "t-d"]);
      const br = (await pgClient.query("select * from public.booking_records where source_id=$1", [id + "-b"])).rows[0];
      assert.strictEqual(Number(br.marketplace_commission_percent), 0);
      assert.strictEqual(br.itinerary_media_id, null);
      assert.strictEqual(br.distributor_tenant_id, null);

      await pgClient.query("delete from public.payment_records where source_id=$1", [id + "-p"]);
      await pgClient.query("delete from public.booking_records where source_id=$1", [id + "-b"]);
    });
  } finally {
    await pgClient.query("alter table public.payment_records drop column if exists invoice_media_id, drop column if exists marketplace_payout_amount, drop column if exists checkout_kind").catch(() => {});
    await pgClient.query("alter table public.booking_records drop column if exists itinerary_media_id, drop column if exists distributor_tenant_id, drop column if exists marketplace_commission_percent").catch(() => {});
    await pgClient.query("drop index if exists public.payment_records_payout_idx").catch(() => {});
    await pgClient.query("drop index if exists public.booking_records_distributor_idx").catch(() => {});
    await pgClient.end().catch(() => {});
  }
});

// ── Test 3: Full revenue schema — all migrations applied together ────────────

test("Revenue record tables have expected commission columns after full migration", async (t) => {
  const pgClient = createPostgresClient(process.env);
  try {
    await pgClient.connect();
  } catch (error) {
    if (shouldSkipForNetwork(error)) {
      t.diagnostic("Skipping revenue schema integration test - PostgreSQL not available");
      return;
    }
    throw error;
  }

  const baseMigrationPath = path.resolve(__dirname, "../../supabase/migrations/20260428160000_create_revenue_record_tables.sql");
  const tokenMigrationPath = path.resolve(__dirname, "../../supabase/migrations/20260430071500_add_public_token_to_payment_records.sql");
  const commissionMigrationPath = path.resolve(__dirname, "../../supabase/migrations/20260610100000_add_missing_commission_columns.sql");

  const baseSql = fs.readFileSync(baseMigrationPath, "utf8");
  const tokenSql = fs.readFileSync(tokenMigrationPath, "utf8");
  const commissionSql = fs.readFileSync(commissionMigrationPath, "utf8");

  try {
    // Apply all three migrations in order
    await t.test("all three migrations apply idempotently", async () => {
      await pgClient.query(baseSql);
      await pgClient.query(tokenSql);
      await pgClient.query(commissionSql);
      // Apply all again to verify idempotency
      await pgClient.query(baseSql);
      await pgClient.query(tokenSql);
      await pgClient.query(commissionSql);
    });

    // Columns referenced by buildPaymentRevenueUpsert in postgresRevenueRecords.js
    const expectedPaymentColumns = [
      "source_id", "tenant_id", "booking_id", "provider",
      "public_token", "provider_reference", "customer_name", "status",
      "currency", "amount", "fee_percent", "fee_amount", "failure_reason",
      "paid_at", "refunded_at", "cancelled_at",
      "invoice_media_id", "marketplace_payout_amount",
      "source_payload", "created_at", "updated_at",
    ];

    // Columns referenced by buildBookingRevenueUpsert in postgresRevenueRecords.js
    const expectedBookingColumns = [
      "source_id", "tenant_id", "quote_proposal_id",
      "traveler_name", "email", "phone", "package_tour",
      "status", "revenue_stage", "payment_status",
      "total_price", "currency", "referral_code", "lead_source", "campaign_label",
      "first_touch_at", "converted_at", "travel_date",
      "itinerary_media_id", "distributor_tenant_id", "marketplace_commission_percent",
      "source_payload", "created_at", "updated_at",
    ];

    await t.test("payment_records has all upsert columns", async () => {
      const r = await pgClient.query(
        "select column_name from information_schema.columns where table_schema='public' and table_name='payment_records'"
      );
      const actualCols = new Set(r.rows.map(r => r.column_name));

      for (const col of expectedPaymentColumns) {
        assert.ok(actualCols.has(col), `payment_records should have column: ${col}`);
      }
      assert.strictEqual(
        actualCols.has("marketplace_payout_amount"), true,
        "Commission-specific column marketplace_payout_amount must exist"
      );
      assert.strictEqual(
        actualCols.has("invoice_media_id"), true,
        "Commission-specific column invoice_media_id must exist"
      );
    });

    await t.test("booking_records has all upsert columns", async () => {
      const r = await pgClient.query(
        "select column_name from information_schema.columns where table_schema='public' and table_name='booking_records'"
      );
      const actualCols = new Set(r.rows.map(r => r.column_name));

      for (const col of expectedBookingColumns) {
        assert.ok(actualCols.has(col), `booking_records should have column: ${col}`);
      }
      assert.strictEqual(
        actualCols.has("distributor_tenant_id"), true,
        "Commission-specific column distributor_tenant_id must exist"
      );
      assert.strictEqual(
        actualCols.has("marketplace_commission_percent"), true,
        "Commission-specific column marketplace_commission_percent must exist"
      );
      assert.strictEqual(
        actualCols.has("itinerary_media_id"), true,
        "Commission-specific column itinerary_media_id must exist"
      );
    });

    await t.test("payment_records index includes payout column", async () => {
      const r = await pgClient.query(
        "select indexdef from pg_indexes where schemaname='public' and tablename='payment_records' and indexname='payment_records_payout_idx'"
      );
      assert.strictEqual(r.rows.length, 1, "payment_records_payout_idx should exist");
      assert.ok(r.rows[0].indexdef.includes("marketplace_payout_amount"));
    });

    await t.test("booking_records index includes distributor column", async () => {
      const r = await pgClient.query(
        "select indexdef from pg_indexes where schemaname='public' and tablename='booking_records' and indexname='booking_records_distributor_idx'"
      );
      assert.strictEqual(r.rows.length, 1, "booking_records_distributor_idx should exist");
      assert.ok(r.rows[0].indexdef.includes("distributor_tenant_id"));
    });

    await t.test("checkout_kind column exists on payment_records", async () => {
      const r = await pgClient.query(
        "select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='payment_records' and column_name='checkout_kind'"
      );
      assert.strictEqual(r.rows.length, 1, "checkout_kind should exist on payment_records");
      assert.strictEqual(r.rows[0].data_type, "text");
      assert.strictEqual(r.rows[0].is_nullable, "NO");
    });

    await t.test("upsert roundtrip with commission data succeeds", async () => {
      // payment_records: insert with all commission-specific columns
      const pid = "test-integ-pay-" + Date.now();
      await pgClient.query(
        `insert into public.payment_records (source_id, tenant_id, provider, customer_name, status, currency, amount,
          marketplace_payout_amount, invoice_media_id, source_payload)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
        [pid, "t-int", "stripe", "Test Customer", "completed", "USD", 200.00, 14.00, "inv-999", JSON.stringify({ kind: "restaurant" })]
      );
      const pr = (await pgClient.query("select * from public.payment_records where source_id=$1", [pid])).rows[0];
      assert.strictEqual(Number(pr.marketplace_payout_amount), 14.00);
      assert.strictEqual(pr.invoice_media_id, "inv-999");
      assert.strictEqual(pr.status, "completed");
      await pgClient.query("delete from public.payment_records where source_id=$1", [pid]);

      // booking_records: insert with all commission-specific columns
      const bid = "test-integ-book-" + Date.now();
      await pgClient.query(
        `insert into public.booking_records (source_id, tenant_id, traveler_name, status, package_tour, total_price,
          itinerary_media_id, distributor_tenant_id, marketplace_commission_percent, source_payload)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
        [bid, "t-int", "Jane Doe", "Confirmed", "Luxury Safari", 5000.00, "itin-888", "dist-777", 10.00, JSON.stringify({ channel: "marketplace" })]
      );
      const br = (await pgClient.query("select * from public.booking_records where source_id=$1", [bid])).rows[0];
      assert.strictEqual(br.itinerary_media_id, "itin-888");
      assert.strictEqual(br.distributor_tenant_id, "dist-777");
      assert.strictEqual(Number(br.marketplace_commission_percent), 10.00);
      assert.strictEqual(br.traveler_name, "Jane Doe");
      await pgClient.query("delete from public.booking_records where source_id=$1", [bid]);
    });
  } finally {
    await pgClient.query("drop table if exists public.booking_records cascade").catch(() => {});
    await pgClient.query("drop table if exists public.payment_records cascade").catch(() => {});
    await pgClient.query("drop table if exists public.quote_records cascade").catch(() => {});
    await pgClient.end().catch(() => {});
  }
});
