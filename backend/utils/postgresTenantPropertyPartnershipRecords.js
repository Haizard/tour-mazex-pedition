import { createPostgresClient } from "./postgresClient.js";

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL tenant property partnership writer is not configured.");
  }

  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const deleteRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL tenant property partnership writer is not configured.");
  }

  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const querySingleRow = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL tenant property partnership writer is not configured.");
  }

  try {
    await client.connect();
    const result = await client.query(statement.text, statement.values);
    return result.rows[0] || null;
  } finally {
    await client.end().catch(() => {});
  }
};

export const buildTenantPropertyPartnershipRecord = (partnership = {}) => ({
  sourceId: String(partnership._id || ""),
  tenantId: String(partnership.tenantId || ""),
  propertyId: String(partnership.propertyId || ""),
  propertyType: partnership.propertyType || "",
  propertyName: partnership.propertyName || "",
  propertySlug: partnership.propertySlug || "",
  ownerTenantId: partnership.ownerTenantId ? String(partnership.ownerTenantId) : null,
  commissionPercent: Number(partnership.commissionPercent || 0),
  status: partnership.status || "active",
  dealNotes: partnership.dealNotes || "",
  sourcePayload: partnership,
});

export const buildTenantPropertyPartnershipUpsert = (partnership = {}) => {
  const record = buildTenantPropertyPartnershipRecord(partnership);

  return {
    text: `
      insert into public.tenant_property_partnerships (
        source_id, tenant_id, property_id, property_type, property_name, property_slug,
        owner_tenant_id, commission_percent, status, deal_notes, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        property_id = excluded.property_id,
        property_type = excluded.property_type,
        property_name = excluded.property_name,
        property_slug = excluded.property_slug,
        owner_tenant_id = excluded.owner_tenant_id,
        commission_percent = excluded.commission_percent,
        status = excluded.status,
        deal_notes = excluded.deal_notes,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.propertyId,
      record.propertyType,
      record.propertyName,
      record.propertySlug,
      record.ownerTenantId,
      record.commissionPercent,
      record.status,
      record.dealNotes,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildTenantPropertyPartnershipDelete = (sourceId = "", tenantId = "") => ({
  text: `
    delete from public.tenant_property_partnerships
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildTenantPropertyPartnershipLookup = (sourceId = "", tenantId = "") => ({
  text: `
    select *
    from public.tenant_property_partnerships
    where source_id = $1 and tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildTenantPropertyPartnershipView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  propertyId: String(row.property_id || ""),
  propertyType: String(row.property_type || ""),
  propertyName: String(row.property_name || ""),
  propertySlug: String(row.property_slug || ""),
  ownerTenantId: row.owner_tenant_id ? String(row.owner_tenant_id) : null,
  commissionPercent: Number(row.commission_percent || 0),
  status: String(row.status || "active"),
  dealNotes: String(row.deal_notes || ""),
});

export const syncTenantPropertyPartnershipRecord = (partnership, env) =>
  upsertRecord(buildTenantPropertyPartnershipUpsert(partnership), env);

export const deleteTenantPropertyPartnershipRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildTenantPropertyPartnershipDelete(sourceId, tenantId), env);

export const findTenantPropertyPartnershipRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildTenantPropertyPartnershipLookup(sourceId, tenantId), env);
