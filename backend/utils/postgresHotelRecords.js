import { createPostgresClient } from "./postgresClient.js";

const asArray = (value) => (Array.isArray(value) ? value : []);
const asNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) throw new Error("PostgreSQL hotel writer is not configured.");
  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const deleteRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) throw new Error("PostgreSQL hotel writer is not configured.");
  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const querySingleRow = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) throw new Error("PostgreSQL hotel reader is not configured.");
  try {
    await client.connect();
    const result = await client.query(statement.text, statement.values);
    return result.rows[0] || null;
  } finally {
    await client.end().catch(() => {});
  }
};

export const buildHotelRecord = (hotel = {}) => ({
  sourceId: String(hotel._id || ""),
  tenantId: String(hotel.tenantId?._id || hotel.tenantId || ""),
  name: hotel.name || "",
  slug: hotel.slug || "",
  summary: hotel.summary || "",
  description: hotel.description || "",
  destination: hotel.destination || "",
  region: hotel.region || "",
  accommodationType: hotel.accommodationType || "hotel",
  amenities: asArray(hotel.amenities),
  roomStyleSummary: hotel.roomStyleSummary || "",
  published: hotel.published === true,
  marketplaceVisible: hotel.marketplaceVisible === true,
  sponsoredPlacement: hotel.sponsoredPlacement === true,
  partnerAccountId: String(hotel.partnerAccountId || ""),
  latitude: asNumberOrNull(hotel.geo?.latitude),
  longitude: asNumberOrNull(hotel.geo?.longitude),
  averageRating: asNumberOrNull(hotel.averageRating),
  reviewCount: Number(hotel.reviewCount || 0),
  trustSummary: hotel.trustSummary || "",
  status: hotel.status || "draft",
  sourcePayload: hotel,
});

export const buildHotelRecordUpsert = (hotel = {}) => {
  const record = buildHotelRecord(hotel);

  return {
    text: `
      insert into public.hotel_records (
        source_id, tenant_id, name, slug, summary, description, destination, region,
        accommodation_type, amenities, room_style_summary, published, marketplace_visible,
        sponsored_placement, partner_account_id, latitude, longitude, average_rating,
        review_count, trust_summary, status, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        name = excluded.name,
        slug = excluded.slug,
        summary = excluded.summary,
        description = excluded.description,
        destination = excluded.destination,
        region = excluded.region,
        accommodation_type = excluded.accommodation_type,
        amenities = excluded.amenities,
        room_style_summary = excluded.room_style_summary,
        published = excluded.published,
        marketplace_visible = excluded.marketplace_visible,
        sponsored_placement = excluded.sponsored_placement,
        partner_account_id = excluded.partner_account_id,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        average_rating = excluded.average_rating,
        review_count = excluded.review_count,
        trust_summary = excluded.trust_summary,
        status = excluded.status,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.name,
      record.slug,
      record.summary,
      record.description,
      record.destination,
      record.region,
      record.accommodationType,
      JSON.stringify(record.amenities || []),
      record.roomStyleSummary,
      record.published,
      record.marketplaceVisible,
      record.sponsoredPlacement,
      record.partnerAccountId,
      record.latitude,
      record.longitude,
      record.averageRating,
      record.reviewCount,
      record.trustSummary,
      record.status,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildHotelRecordLookup = (sourceId, tenantId) => ({
  text: "select * from public.hotel_records where source_id = $1 and tenant_id = $2 limit 1",
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildHotelRecordDelete = (sourceId, tenantId) => ({
  text: "delete from public.hotel_records where source_id = $1 and tenant_id = $2",
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildHotelRecordView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  name: String(row.name || ""),
  slug: String(row.slug || ""),
  summary: String(row.summary || ""),
  description: String(row.description || ""),
  destination: String(row.destination || ""),
  region: String(row.region || ""),
  accommodationType: String(row.accommodation_type || "hotel"),
  amenities: asArray(row.amenities),
  roomStyleSummary: String(row.room_style_summary || ""),
  published: row.published === true,
  marketplaceVisible: row.marketplace_visible === true,
  sponsoredPlacement: row.sponsored_placement === true,
  partnerAccountId: String(row.partner_account_id || ""),
  geo: {
    latitude: row.latitude === null || typeof row.latitude === "undefined" ? null : Number(row.latitude),
    longitude: row.longitude === null || typeof row.longitude === "undefined" ? null : Number(row.longitude),
  },
  averageRating:
    row.average_rating === null || typeof row.average_rating === "undefined"
      ? null
      : Number(row.average_rating),
  reviewCount: Number(row.review_count || 0),
  trustSummary: String(row.trust_summary || ""),
  status: String(row.status || "draft"),
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
});

export const syncHotelRecord = (hotel, env) => upsertRecord(buildHotelRecordUpsert(hotel), env);
export const deleteHotelRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildHotelRecordDelete(sourceId, tenantId), env);
export const findHotelRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildHotelRecordLookup(sourceId, tenantId), env);
