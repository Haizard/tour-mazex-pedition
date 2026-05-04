import { createPostgresClient } from "../backend/utils/postgresClient.js";

async function migrate() {
  const client = createPostgresClient(process.env);
  if (!client) {
    console.error("Postgres client not configured.");
    process.exit(1);
  }

  try {
    await client.connect();
    console.log("Connected to Postgres. Running DDL...");

    await client.query(`
      ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS invoice_media_id text;
      ALTER TABLE public.booking_records ADD COLUMN IF NOT EXISTS itinerary_media_id text;
    `);

    console.log("DDL update successful.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
