import { createPostgresClient } from "./postgresClient.js";

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL competitor writer is not configured.");
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
    throw new Error("PostgreSQL competitor writer is not configured.");
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
    throw new Error("PostgreSQL competitor writer is not configured.");
  }

  try {
    await client.connect();
    const result = await client.query(statement.text, statement.values);
    return result.rows[0] || null;
  } finally {
    await client.end().catch(() => {});
  }
};

const toIso = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const buildCompetitorInsightRecord = (insight = {}) => ({
  sourceId: String(insight._id || ""),
  tenantId: String(insight.tenantId || ""),
  competitorName: insight.competitorName || "",
  marketRegion: insight.marketRegion || "",
  focusRoute: insight.focusRoute || "",
  observedPriceUsd:
    insight.observedPriceUsd === null || insight.observedPriceUsd === undefined
      ? null
      : Number(insight.observedPriceUsd || 0),
  currency: insight.currency || "USD",
  marketTrend: insight.marketTrend || "",
  offerSummary: insight.offerSummary || "",
  sourceLabel: insight.sourceLabel || "",
  intelligenceDate: insight.intelligenceDate ? new Date(insight.intelligenceDate).toISOString() : null,
  strengthSignals: Array.isArray(insight.strengthSignals) ? insight.strengthSignals : [],
  riskSignals: Array.isArray(insight.riskSignals) ? insight.riskSignals : [],
  status: insight.status || "watchlist",
  notes: insight.notes || "",
  sourcePayload: insight,
});

export const buildCompetitorInsightUpsert = (insight = {}) => {
  const record = buildCompetitorInsightRecord(insight);

  return {
    text: `
      insert into public.competitor_insight_records (
        source_id, tenant_id, competitor_name, market_region, focus_route, observed_price_usd,
        currency, market_trend, offer_summary, source_label, intelligence_date, strength_signals,
        risk_signals, status, notes, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        competitor_name = excluded.competitor_name,
        market_region = excluded.market_region,
        focus_route = excluded.focus_route,
        observed_price_usd = excluded.observed_price_usd,
        currency = excluded.currency,
        market_trend = excluded.market_trend,
        offer_summary = excluded.offer_summary,
        source_label = excluded.source_label,
        intelligence_date = excluded.intelligence_date,
        strength_signals = excluded.strength_signals,
        risk_signals = excluded.risk_signals,
        status = excluded.status,
        notes = excluded.notes,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.competitorName,
      record.marketRegion,
      record.focusRoute,
      record.observedPriceUsd,
      record.currency,
      record.marketTrend,
      record.offerSummary,
      record.sourceLabel,
      record.intelligenceDate,
      JSON.stringify(record.strengthSignals || []),
      JSON.stringify(record.riskSignals || []),
      record.status,
      record.notes,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const buildCompetitorInsightDelete = (sourceId = "", tenantId = "") => ({
  text: `
    delete from public.competitor_insight_records
    where source_id = $1 and tenant_id = $2
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildCompetitorInsightLookup = (sourceId = "", tenantId = "") => ({
  text: `
    select *
    from public.competitor_insight_records
    where source_id = $1 and tenant_id = $2
    limit 1
  `,
  values: [String(sourceId || ""), String(tenantId || "")],
});

export const buildCompetitorInsightView = (row = {}) => ({
  _id: String(row.source_id || ""),
  tenantId: String(row.tenant_id || ""),
  competitorName: String(row.competitor_name || ""),
  marketRegion: String(row.market_region || ""),
  focusRoute: String(row.focus_route || ""),
  observedPriceUsd:
    row.observed_price_usd === null || row.observed_price_usd === undefined ? null : Number(row.observed_price_usd || 0),
  currency: String(row.currency || "USD"),
  marketTrend: String(row.market_trend || ""),
  offerSummary: String(row.offer_summary || ""),
  sourceLabel: String(row.source_label || ""),
  intelligenceDate: toIso(row.intelligence_date),
  strengthSignals: Array.isArray(row.strength_signals) ? row.strength_signals : [],
  riskSignals: Array.isArray(row.risk_signals) ? row.risk_signals : [],
  status: String(row.status || "watchlist"),
  notes: String(row.notes || ""),
});

export const syncCompetitorInsightRecord = (insight, env) =>
  upsertRecord(buildCompetitorInsightUpsert(insight), env);

export const deleteCompetitorInsightRecord = (sourceId, tenantId, env) =>
  deleteRecord(buildCompetitorInsightDelete(sourceId, tenantId), env);

export const findCompetitorInsightRecord = (sourceId, tenantId, env) =>
  querySingleRow(buildCompetitorInsightLookup(sourceId, tenantId), env);
