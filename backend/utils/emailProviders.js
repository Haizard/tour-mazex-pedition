export const EMAIL_PROVIDER_REGISTRY = {
  gmail: {
    id: "gmail",
    label: "Gmail",
    authModes: ["oauth"],
    defaultScopes: ["gmail.readonly", "gmail.send"],
    connectionTypes: ["mailbox"],
    syncReadiness: "scaffolded",
    setupChecklist: [
      "Create a Google OAuth client for the tenant mailbox.",
      "Grant readonly and send scopes.",
      "Store encrypted refresh tokens before enabling live sync.",
    ],
  },
  outlook: {
    id: "outlook",
    label: "Outlook",
    authModes: ["oauth"],
    defaultScopes: ["mail.read", "mail.send"],
    connectionTypes: ["mailbox"],
    syncReadiness: "scaffolded",
    setupChecklist: [
      "Register an Azure app for Microsoft Graph.",
      "Enable delegated Mail.Read and Mail.Send permissions.",
      "Persist encrypted tokens before mailbox polling is enabled.",
    ],
  },
  imap: {
    id: "imap",
    label: "IMAP / SMTP",
    authModes: ["password"],
    defaultScopes: ["imap.read", "smtp.send"],
    connectionTypes: ["mailbox"],
    syncReadiness: "planned",
    setupChecklist: [
      "Capture mailbox hostnames and ports.",
      "Store credentials in encrypted secrets.",
      "Add provider health checks before production sync.",
    ],
  },
  resend: {
    id: "resend",
    label: "Resend",
    authModes: ["api_key"],
    defaultScopes: ["transactional.send"],
    connectionTypes: ["delivery"],
    syncReadiness: "partial",
    setupChecklist: [
      "Create a Resend API key with tenant ownership.",
      "Verify the tenant sending domain.",
      "Add outbound event webhook ingestion for reply tracking.",
    ],
  },
};

export const listEmailProviders = () => Object.values(EMAIL_PROVIDER_REGISTRY);

export const getEmailProviderDefinition = (providerId) =>
  EMAIL_PROVIDER_REGISTRY[providerId] || null;
