import { createPostgresClient } from "./postgresClient.js";

const upsertRecord = async (statement, env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    throw new Error("PostgreSQL partner writer is not configured.");
  }

  try {
    await client.connect();
    await client.query(statement.text, statement.values);
  } finally {
    await client.end().catch(() => {});
  }
};

export const buildPartnerAccountRecord = (partner = {}) => ({
  sourceId: String(partner._id || ""),
  tenantId: String(partner.tenantId || ""),
  partnerType: partner.partnerType || "hotel",
  companyName: partner.companyName || "",
  contactName: partner.contactName || "",
  email: partner.email || "",
  phone: partner.phone || "",
  location: partner.location || "",
  serviceFocus: partner.serviceFocus || "",
  contractLabel: partner.contractLabel || "",
  payoutTerms: partner.payoutTerms || "",
  notes: partner.notes || "",
  status: partner.status || "pending",
  sourcePayload: partner,
});

export const buildPartnerAccountUpsert = (partner = {}) => {
  const record = buildPartnerAccountRecord(partner);

  return {
    text: `
      insert into public.partner_account_records (
        source_id, tenant_id, partner_type, company_name, contact_name, email, phone,
        location, service_focus, contract_label, payout_terms, notes, status, source_payload
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb
      )
      on conflict (source_id)
      do update set
        tenant_id = excluded.tenant_id,
        partner_type = excluded.partner_type,
        company_name = excluded.company_name,
        contact_name = excluded.contact_name,
        email = excluded.email,
        phone = excluded.phone,
        location = excluded.location,
        service_focus = excluded.service_focus,
        contract_label = excluded.contract_label,
        payout_terms = excluded.payout_terms,
        notes = excluded.notes,
        status = excluded.status,
        source_payload = excluded.source_payload,
        updated_at = now()
    `,
    values: [
      record.sourceId,
      record.tenantId,
      record.partnerType,
      record.companyName,
      record.contactName,
      record.email,
      record.phone,
      record.location,
      record.serviceFocus,
      record.contractLabel,
      record.payoutTerms,
      record.notes,
      record.status,
      JSON.stringify(record.sourcePayload || {}),
    ],
  };
};

export const syncPartnerAccountRecord = (partner, env) =>
  upsertRecord(buildPartnerAccountUpsert(partner), env);
