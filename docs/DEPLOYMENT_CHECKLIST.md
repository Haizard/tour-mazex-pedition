# Production Deployment Checklist — Supabase Migrations

> **Date:** June 10, 2026  
> **Scope:** Two new migrations for partnership commission flow + missing revenue columns  
> **Project:** Maz Expeditions Platform — Supabase project `jwidaznpndcsqzsvmemn` (eu-west-1)

---

## Overview

Two new migrations need to be applied in **this exact order**:

| # | Migration | What it does | Risk |
|---|-----------|-------------|------|
| 1 | `20260610090000_create_tenant_property_partnerships.sql` | Creates new `tenant_property_partnerships` table + indexes | **Low** — new table only, no existing data affected |
| 2 | `20260610100000_add_missing_commission_columns.sql` | Adds 6 columns to `payment_records` and `booking_records` + 2 indexes | **Medium** — alters existing tables with `NOT NULL DEFAULT` on busy tables |

All statements use `IF NOT EXISTS` — they are safe to re-run.

---

## Prerequisites

- [ ] Supabase CLI installed locally (`supabase --version`)
- [ ] Supabase CLI linked to the project:
      ```bash
      supabase link --project-ref jwidaznpndcsqzsvmemn
      ```
- [ ] Production database credentials on hand (password in 1Password / vault)
- [ ] Recent backup of the production database downloaded to `.psql` file
- [ ] Local checkout on `main` at commit `bfbc8c8`
- [ ] All 31 tests pass locally (`node --test backend/tests/...`)

---

## Step 1 — Backup the Production Database

> **Why:** Tables `payment_records` and `booking_records` contain production revenue data.
> Although the migration is additive and reversible, a backup is required before altering production tables.

```bash
# Download a full backup from Supabase Dashboard:
#   Database → Backups → Trigger a manual backup → Download

# Or via pg_dump (you will be prompted for the password):
pg_dump \
  --host=db.jwidaznpndcsqzsvmemn.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --format=custom \
  --no-owner \
  --file=./backups/pre-migration-2026-06-10.dump
```

> **Tip:** To avoid password prompts in scripts, set `PGPASSWORD` or use a `.pgpass` file.

- [ ] Backup downloaded to `./backups/pre-migration-2026-06-10.dump`
- [ ] Backup file verified (non-zero size, valid header)
- [ ] Backup uploaded to secure storage (S3 / Google Drive / vault)

---

## Step 2 — Dry-Run on Staging / Local

- [ ] Apply migrations via Supabase CLI on local dev database:
      ```bash
      supabase db push --local
      ```
- [ ] Verify table `tenant_property_partnerships` exists:
      ```sql
      select column_name, data_type, is_nullable, column_default
      from information_schema.columns
      where table_name = 'tenant_property_partnerships'
      order by ordinal_position;
      ```
- [ ] Verify new columns exist on `payment_records`:
      ```sql
      select column_name, data_type, is_nullable
      from information_schema.columns
      where table_name = 'payment_records'
        and column_name in ('invoice_media_id', 'marketplace_payout_amount', 'checkout_kind')
      order by ordinal_position;
      ```
- [ ] Verify new columns exist on `booking_records`:
      ```sql
      select column_name, data_type, is_nullable
      from information_schema.columns
      where table_name = 'booking_records'
        and column_name in ('itinerary_media_id', 'distributor_tenant_id', 'marketplace_commission_percent')
      order by ordinal_position;
      ```
- [ ] Verify both new indexes exist:
      ```sql
      select indexname, indexdef
      from pg_indexes
      where tablename in ('payment_records', 'booking_records')
        and indexname in ('payment_records_payout_idx', 'booking_records_distributor_idx');
      ```
- [ ] Run integration test:
      ```bash
      node --test backend/tests/tenantPropertyPartnershipMigration.test.js
      ```
      (All 21 sub-tests should pass — the PG-dependent ones will run against your local DB)

---

## Step 3 — Apply to Production

### Option A: Supabase CLI (recommended)

> **Note:** `supabase db push` applies all unapplied migrations in `supabase/migrations/`
> in timestamp order. Since every migration uses `IF NOT EXISTS`, re-running already-applied
> migrations is safe — existing objects are left unchanged.

```bash
supabase db push --linked
```

This applies all unapplied migrations in `supabase/migrations/` in timestamp order.

- [ ] Migration command completed with exit code 0
- [ ] No errors in output

### Option B: Manual SQL via psql

If you prefer applying the SQL directly:

```bash
# Migration 1: Create tenant_property_partnerships table
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260610090000_create_tenant_property_partnerships.sql

# Migration 2: Add commission columns
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260610100000_add_missing_commission_columns.sql
```

- [ ] Migration 1 applied successfully
- [ ] Migration 2 applied successfully

### Option C: Supabase Dashboard SQL Editor

1. Navigate to [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/jwidaznpndcsqzsvmemn/sql/new)
2. Open `supabase/migrations/20260610090000_create_tenant_property_partnerships.sql`
3. Run the entire script
4. Open `supabase/migrations/20260610100000_add_missing_commission_columns.sql`
5. Run the entire script

- [ ] Both scripts executed without errors

---

## Step 4 — Verify Production

- [ ] Query the table metadata:
      ```sql
      select table_name, column_name, data_type, is_nullable
      from information_schema.columns
      where table_name in ('tenant_property_partnerships', 'payment_records', 'booking_records')
      order by table_name, ordinal_position;
      ```
- [ ] Confirm `tenant_property_partnerships` has **13 columns**
- [ ] Confirm `payment_records` has columns: `invoice_media_id` (text, nullable), `marketplace_payout_amount` (numeric, not null default 0), `checkout_kind` (text, not null default '')
- [ ] Confirm `booking_records` has columns: `itinerary_media_id` (text, nullable), `distributor_tenant_id` (text, nullable), `marketplace_commission_percent` (numeric, not null default 0)
- [ ] Confirm indexes exist:
      ```sql
      select indexname, indexdef from pg_indexes
      where indexname in ('payment_records_payout_idx', 'booking_records_distributor_idx');
      ```
- [ ] Test the commission report endpoint:
      ```bash
      curl -s https://mazexpeditions.vercel.app/api/partner-properties/commission-report \
        -H "Authorization: Bearer <admin-token>" | head -50
      ```
- [ ] Test the partner properties API:
      ```bash
      curl -s https://mazexpeditions.vercel.app/api/partner-properties/public \
        -H "x-tenant-slug: your-tenant"
      ```

---

## Step 5 — Monitor

- [ ] **Server logs**: Check for `column "checkout_kind" does not exist` or similar errors in Vercel function logs
- [ ] **Commission report**: Open the admin dashboard → Commission Report tab → verify it renders
- [ ] **Hotel checkout**: Submit a test hotel reservation → confirm commission data is stored
- [ ] **Restaurant deposit**: Submit a test restaurant deposit → confirm commission data is stored
- [ ] **Revenue sync**: Trigger a payment sync → confirm `checkout_kind` column is populated (not empty string)
- [ ] **MongoDB shadow writes**: Verify the `startShadowWriteReplayLoop` log shows no errors processing the new partnership records
- [ ] **Payment flows**: 24h post-deployment — monitor Stripe webhook processing for any new payment-related errors

---

## Step 6 — Rollback Plan

> **If something goes wrong**, the migration is additive but **partially reversible**.

### Rollback Migration 2 (commission columns)

See [`docs/ROLLBACK_20260610100000.sql`](./ROLLBACK_20260610100000.sql) for the full rollback SQL.

```bash
psql "$SUPABASE_DB_URL" -f docs/ROLLBACK_20260610100000.sql
```

- [ ] Rollback SQL tested on staging first

### Rollback Migration 1 (new table)

```sql
drop table if exists public.tenant_property_partnerships cascade;
```

> **⚠️ Warning:** Dropping columns removes data. The `DROP COLUMN` statements in the rollback file are **destructive**. Only proceed if you accept data loss for those columns.

### If the app is broken but data is intact:

> **Code rollback is always safe** — the app handles missing tables/columns gracefully.

1. The app uses `IF NOT EXISTS` patterns and graceful fallbacks (`syncPaymentRevenueRecord` catches missing column errors)
2. If a column is missing, the app falls back to the legacy upsert (fewer columns)
3. If the entire partnership table is missing, the commission report endpoint returns `{ configured: false }` — the app degrades gracefully
4. **Rolling back the code** (reverting to previous commit) is always safe — the new code handles missing tables/columns gracefully

---

## Quick Reference

| Resource | Value |
|----------|-------|
| Supabase project ref | `jwidaznpndcsqzsvmemn` |
| Supabase region | `eu-west-1` |
| Supabase Dashboard | https://supabase.com/dashboard/project/jwidaznpndcsqzsvmemn |
| Live site | https://mazexpeditions.vercel.app |
| Pooler URL | `postgresql://postgres.jwidaznpndcsqzsvmemn:<password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres` |
| DB host | `db.jwidaznpndcsqzsvmemn.supabase.co` |
| Supabase CLI link | `supabase link --project-ref jwidaznpndcsqzsvmemn` |
| Commit to deploy | `bfbc8c8` |

---

## Migration SQL — At a Glance

### Migration 1: `20260610090000_create_tenant_property_partnerships.sql`

Creates `public.tenant_property_partnerships` with:
- 13 columns (source_id PK, tenant_id, property_id, property_type, property_name, property_slug, owner_tenant_id, commission_percent, status, deal_notes, source_payload, created_at, updated_at)
- 2 indexes (tenant+status, property_id+property_type)
- All `IF NOT EXISTS` — idempotent

### Migration 2: `20260610100000_add_missing_commission_columns.sql`

Adds to `payment_records`:
- `invoice_media_id text` (nullable)
- `marketplace_payout_amount numeric(15,2) NOT NULL DEFAULT 0`
- `checkout_kind text NOT NULL DEFAULT ''`
- Partial index: `payment_records_payout_idx WHERE marketplace_payout_amount > 0`

Adds to `booking_records`:
- `itinerary_media_id text` (nullable)
- `distributor_tenant_id text` (nullable)
- `marketplace_commission_percent numeric(10,2) NOT NULL DEFAULT 0`
- Partial index: `booking_records_distributor_idx WHERE distributor_tenant_id IS NOT NULL AND distributor_tenant_id != ''`

---

## Checklist Summary

```
□ Prerequisites verified
□ Production database backed up
□ Dry-run on local/staging completed
□ Migration 1 applied to production
□ Migration 2 applied to production
□ Schema verified on production
□ Commission endpoints tested
□ 24h monitoring started
□ Rollback SQL prepared
```
