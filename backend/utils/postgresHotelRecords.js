import { createPostgresClient } from "./postgresClient.js";

const toNumber = (value, fallback = 0) =>
  value === null || value === undefined || value === "" ? fallback : Number(value);

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL hotel writer is not configured.");
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
    throw new Error("PostgreSQL hotel writer is not configured.");
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
    throw new Error("PostgreSQL hotel reader is not configured.");
  }

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
  tenantId: String(hotel.tenantId || ""),
  partnerAccountId: hotel.partnerAccountId ? String(hotel.partnerAccountId) : "",
  hotelName: hotel.hotelName || "",
  slug: hotel.slug || "",
  destination: hotel.destination || "",
  region: hotel.region || "",
  hotelType: hotel.hotelType || "hotel",
  description: hotel.description || "",
  amenityTags: Array.isArray(hotel.amenityTags) ? hotel.amenityTags : [],
  roomStyleSummary: hotel.roomStyleSummary || "",
  publishedStatus: hotel.publishedStatus || "draft",
  trustRating: toNumber(hotel.trust?.rating, 0),
  reviewCount: toNumber(hotel.trust?.reviewCount, 0),
  latitude:
    hotel.coordinates?.latitude === null || hotel.coordinates?.latitude === undefined
      ? null
      : Number(hotel.coordinates.latitude),
  longitude:
    hotel.coordinates?.longitude === null || hotel.coordinates?.longitude === undefined
      ? null
      : Number(hotel.coordinates.longitude),
  sourcePayload: hotel,
});

export const buildHotelUpsert = (hotel = {}) => {
  const record = buildHotelRecord(hotel);

  return {
    text: `
      insert into public.hotel_records (
        source_id, tenant_id, partner_account_id, hotel_name, slug, destination, region,
        hotel_type, description, amenity_tags, room_style_summary, published_status,
        trust_rating, review_count, latitude, longitude, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        partner_account_id = excluded.partner_account_id,
        hotel_name = excluded.hotel_name,
        slug = excluded.slug,
        destination = excluded.destination,
        region = excluded.region,
        hotel_type = excluded.hotel_type,
        description = excluded.description,
        amenity_tags = excluded.amenity_tags,
        room_style_summary = excluded.room_style_summary,
        published_status = excluded.published_status,
        trust_rating = excluded.trust_rating,
        review_count = excluded.review_count,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.partnerAccountId,
      record.hotelName,
      record.slug,
      record.destination,
      record.region,
      record.hotelType,
      record.description,
      record.amenityTags,
      record.roomStyleSummary,
      record.publishedStatus,
      record.trustRating,
      record.reviewCount,
      record.latitude,
      record.longitude,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildHotelDelete = (sourceId = "", tenantId = "") => ({
  text: `
    delete from public.hotel_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildHotelLookup = (sourceId = "", tenantId = "") => ({
  text: `
    select *
    from public.hotel_records
    where source_id = $1 and tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildHotelView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  partnerAccountId: row.partner_account_id ? String(row.partner_account_id) : "",
  hotelName: String(row.hotel_name || ""),
  slug: String(row.slug || ""),
  destination: String(row.destination || ""),
  region: String(row.region || ""),
  hotelType: String(row.hotel_type || "hotel"),
  description: String(row.description || ""),
  amenityTags: Array.isArray(row.amenity_tags) ? row.amenity_tags : [],
  roomStyleSummary: String(row.room_style_summary || ""),
  publishedStatus: String(row.published_status || "draft"),
  coordinates: {
    latitude:
      row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude:
      row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
  },
  trust: {
    rating: toNumber(row.trust_rating, 0),
    reviewCount: toNumber(row.review_count, 0),
  },
  aiHighlights: Array.isArray(row.source_payload?.aiHighlights)
    ? row.source_payload.aiHighlights
    : [],
});

export const syncHotelRecord = (hotel, env) =>
  upsertRecord(buildHotelUpsert(hotel), env);

export const deleteHotelRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildHotelDelete(sourceId, tenantId), env);

export const findHotelRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildHotelLookup(sourceId, tenantId), env);

