import {
  getEmailProviderDefinition,
  listEmailProviders,
} from "./emailProviders.js";

export const getEmailProviderCatalog = () =>
  listEmailProviders().map((provider) => ({
    ...provider,
    supportsSyncToday: provider.syncReadiness !== "planned",
  }));

export const buildEmailConnectionPayload = (body = {}) => {
  const provider = getEmailProviderDefinition(body.provider);

  if (!provider) {
    throw new Error("Unsupported email provider.");
  }

  const authMode = body.authMode || provider.authModes[0];

  if (!provider.authModes.includes(authMode)) {
    throw new Error(`Provider ${provider.label} does not support ${authMode}.`);
  }

  const connectionType = body.connectionType || provider.connectionTypes[0];

  return {
    provider: provider.id,
    connectionType,
    label: body.label || "",
    status: body.status || "draft",
    authMode,
    accountIdentifier: body.accountIdentifier || "",
    scopes:
      Array.isArray(body.scopes) && body.scopes.length
        ? body.scopes
        : provider.defaultScopes,
    metadata: {
      providerLabel: provider.label,
      syncReadiness: provider.syncReadiness,
      setupChecklist: provider.setupChecklist,
      note: "Provider credentials should be encrypted before production rollout.",
      ...(body.metadata || {}),
    },
  };
};

export const buildConnectionHealthSnapshot = (connection) => {
  const provider = getEmailProviderDefinition(connection.provider);

  if (!provider) {
    return {
      ok: false,
      status: "error",
      checkedAt: new Date(),
      readiness: "unknown",
      message: "Provider definition is missing.",
      nextStep: "Repair the provider registry entry before enabling sync.",
    };
  }

  const hasAccountIdentifier = Boolean(connection.accountIdentifier?.trim());
  const hasScopes = Array.isArray(connection.scopes) && connection.scopes.length > 0;
  const authLooksConfigured =
    connection.authMode === "oauth"
      ? hasAccountIdentifier
      : connection.authMode === "api_key"
        ? hasAccountIdentifier
        : hasAccountIdentifier;

  const ok = hasAccountIdentifier && hasScopes && authLooksConfigured;
  const status = ok ? "connected" : "draft";

  return {
    ok,
    status,
    checkedAt: new Date(),
    readiness: provider.syncReadiness,
    message: ok
      ? `${provider.label} connection scaffold is internally consistent.`
      : `The ${provider.label} connection still needs more configuration before live sync.`,
    nextStep: ok
      ? "Add encrypted credentials and token refresh handling to enable real sync."
      : provider.setupChecklist?.[0] || "Complete provider setup.",
    checklist: provider.setupChecklist || [],
  };
};

export const buildSyncJobSnapshot = (connection) => {
  const provider = getEmailProviderDefinition(connection.provider);
  const syncReady = Boolean(connection.metadata?.healthCheck?.ok);
  const discovered = syncReady ? 6 : 0;
  const processed = syncReady ? 4 : 0;

  return {
    direction: connection.connectionType === "delivery" ? "push" : "pull",
    status: syncReady ? "completed" : "failed",
    startedAt: new Date(),
    completedAt: new Date(),
    resultSummary: syncReady
      ? `${provider?.label || connection.provider} sync scaffold completed successfully.`
      : `Sync scaffold blocked because the connection has not passed health checks yet.`,
    recordsDiscovered: discovered,
    recordsProcessed: processed,
    errorMessage: syncReady ? "" : "Run a successful health check before triggering sync.",
    metadata: {
      providerLabel: provider?.label || connection.provider,
      readiness: provider?.syncReadiness || "unknown",
      simulated: true,
    },
  };
};
