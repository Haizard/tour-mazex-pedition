import { createPostgresClient } from "../backend/utils/postgresClient.js";

async function migrate() {
  const client = createPostgresClient(process.env);
  if (!client) {
    console.error("Postgres client not configured.");
    process.exit(1);
  }

  try {
    await client.connect();
    console.log("Connected to Postgres. Running Marketplace Schema Updates...");

    await client.query(`
      ALTER TABLE public.booking_records ADD COLUMN IF NOT EXISTS distributor_tenant_id text;
      ALTER TABLE public.booking_records ADD COLUMN IF NOT EXISTS marketplace_commission_percent numeric(10,2);
      ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS marketplace_payout_amount numeric(15,2);
    `);

    console.log("Marketplace Schema update successful.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
