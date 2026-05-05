import { createPostgresClient } from "./postgresClient.js";

/**
 * Syncs a marketplace partnership record to PostgreSQL.
 */
export const syncMarketplacePartnershipRecord = async (partnership = {}, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) return null;

  try {
    await client.connect();

    const query = `
      INSERT INTO public.marketplace_partnership_records (
        source_id,
        provider_tenant_id,
        distributor_tenant_id,
        status,
        commission_percent,
        allowed_tour_ids,
        shared_at,
        last_sync_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (provider_tenant_id, distributor_tenant_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        commission_percent = EXCLUDED.commission_percent,
        allowed_tour_ids = EXCLUDED.allowed_tour_ids,
        shared_at = EXCLUDED.shared_at,
        last_sync_at = EXCLUDED.last_sync_at,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;

    const values = [
      String(partnership._id || ""),
      String(partnership.providerTenantId || ""),
      String(partnership.distributorTenantId || ""),
      partnership.status || "requested",
      Number(partnership.commissionPercent || 15),
      partnership.allowedTourIds || [],
      partnership.sharedAt || null,
      new Date(),
      partnership.createdAt || new Date(),
      new Date(),
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    await client.end().catch(() => {});
  }
};

/**
 * Deletes a marketplace partnership record from PostgreSQL.
 */
export const deleteMarketplacePartnershipRecord = async (providerId, distributorId, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) return null;

  try {
    await client.connect();
    await client.query(
      "DELETE FROM public.marketplace_partnership_records WHERE provider_tenant_id = $1 AND distributor_tenant_id = $2",
      [providerId, distributorId]
    );
  } finally {
    await client.end().catch(() => {});
  }
};
