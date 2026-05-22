import { createPostgresClient } from "./postgresClient.js";

const asArray = (value) => (Array.isArray(value) ? value : []);
const asNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) throw new Error("PostgreSQL restaurant writer is not configured.");
  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const deleteRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) throw new Error("PostgreSQL restaurant writer is not configured.");
  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

const querySingleRow = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);
  if (!client) throw new Error("PostgreSQL restaurant reader is not configured.");
  try {
    await client.connect();
    const result = await client.query(statement.text, statement.values);
    return result.rows[0] || null;
  } finally {
    await client.end().catch(() => {});
  }
};

export const buildRestaurantRecord = (restaurant = {}) => ({
  sourceId: String(restaurant._id || ""),
  tenantId: String(restaurant.tenantId?._id || restaurant.tenantId || ""),
  partnerAccountId: String(restaurant.partnerAccountId || ""),
  name: restaurant.name || "",
  slug: restaurant.slug || "",
  summary: restaurant.summary || "",
  description: restaurant.description || "",
  destination: restaurant.destination || "",
  region: restaurant.region || "",
  latitude: asNumberOrNull(restaurant.geo?.latitude),
  longitude: asNumberOrNull(restaurant.geo?.longitude),
  cuisineTypes: asArray(restaurant.cuisineTypes),
  mealTypes: asArray(restaurant.mealTypes),
  dietaryFits: asArray(restaurant.dietaryFits),
  ambianceTags: asArray(restaurant.ambianceTags),
  openingHoursSummary: restaurant.openingHoursSummary || "",
  reservationStyleSummary: restaurant.reservationStyleSummary || "",
  photos: asArray(restaurant.photos),
  averageRating: asNumberOrNull(restaurant.averageRating),
  reviewCount: Number(restaurant.reviewCount || 0),
  trustSummary: restaurant.trustSummary || "",
  published: restaurant.published === true,
  marketplaceVisible: restaurant.marketplaceVisible === true,
  sponsoredPlacement: restaurant.sponsoredPlacement === true,
  status: restaurant.status || "draft",
  sourcePayload: restaurant,
});

export const buildRestaurantRecordUpsert = (restaurant = {}) => {
  const record = buildRestaurantRecord(restaurant);

  return {
    text: `
      insert into public.restaurant_records (
        source_id, tenant_id, partner_account_id, name, slug, summary, description,
        destination, region, latitude, longitude, cuisine_types, meal_types,
        dietary_fits, ambiance_tags, opening_hours_summary, reservation_style_summary,
        photos, average_rating, review_count, trust_summary, published,
        marketplace_visible, sponsored_placement, status, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,
        $16,$17,$18::jsonb,$19,$20,$21,$22,$23,$24,$25,$26::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        partner_account_id = excluded.partner_account_id,
        name = excluded.name,
        slug = excluded.slug,
        summary = excluded.summary,
        description = excluded.description,
        destination = excluded.destination,
        region = excluded.region,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        cuisine_types = excluded.cuisine_types,
        meal_types = excluded.meal_types,
        dietary_fits = excluded.dietary_fits,
        ambiance_tags = excluded.ambiance_tags,
        opening_hours_summary = excluded.opening_hours_summary,
        reservation_style_summary = excluded.reservation_style_summary,
        photos = excluded.photos,
        average_rating = excluded.average_rating,
        review_count = excluded.review_count,
        trust_summary = excluded.trust_summary,
        published = excluded.published,
        marketplace_visible = excluded.marketplace_visible,
        sponsored_placement = excluded.sponsored_placement,
        status = excluded.status,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.partnerAccountId,
      record.name,
      record.slug,
      record.summary,
      record.description,
      record.destination,
      record.region,
      record.latitude,
      record.longitude,
      JSON.stringify(record.cuisineTypes || []),
      JSON.stringify(record.mealTypes || []),
      JSON.stringify(record.dietaryFits || []),
      JSON.stringify(record.ambianceTags || []),
      record.openingHoursSummary,
      record.reservationStyleSummary,
      JSON.stringify(record.photos || []),
      record.averageRating,
      record.reviewCount,
      record.trustSummary,
      record.published,
      record.marketplaceVisible,
      record.sponsoredPlacement,
      record.status,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildRestaurantRecordLookup = (sourceId, tenantId) => ({
  text: "select * from public.restaurant_records where source_id = $1 and tenant_id = $2 limit 1",
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildRestaurantRecordDelete = (sourceId, tenantId) => ({
  text: "delete from public.restaurant_records where source_id = $1 and tenant_id = $2",
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildRestaurantRecordView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  partnerAccountId: String(row.partner_account_id || ""),
  name: String(row.name || ""),
  slug: String(row.slug || ""),
  summary: String(row.summary || ""),
  description: String(row.description || ""),
  destination: String(row.destination || ""),
  region: String(row.region || ""),
  geo: {
    latitude:
      row.latitude === null || typeof row.latitude === "undefined"
        ? null
        : Number(row.latitude),
    longitude:
      row.longitude === null || typeof row.longitude === "undefined"
        ? null
        : Number(row.longitude),
  },
  cuisineTypes: asArray(row.cuisine_types),
  mealTypes: asArray(row.meal_types),
  dietaryFits: asArray(row.dietary_fits),
  ambianceTags: asArray(row.ambiance_tags),
  openingHoursSummary: String(row.opening_hours_summary || ""),
  reservationStyleSummary: String(row.reservation_style_summary || ""),
  photos: asArray(row.photos),
  averageRating:
    row.average_rating === null || typeof row.average_rating === "undefined"
      ? null
      : Number(row.average_rating),
  reviewCount: Number(row.review_count || 0),
  trustSummary: String(row.trust_summary || ""),
  published: row.published === true,
  marketplaceVisible: row.marketplace_visible === true,
  sponsoredPlacement: row.sponsored_placement === true,
  status: String(row.status || "draft"),
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
});

export const syncRestaurantRecord = (restaurant, env) =>
  upsertRecord(buildRestaurantRecordUpsert(restaurant), env);
export const deleteRestaurantRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildRestaurantRecordDelete(sourceId, tenantId), env);
export const findRestaurantRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildRestaurantRecordLookup(sourceId, tenantId), env);
