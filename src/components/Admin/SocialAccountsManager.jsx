import { useEffect, useMemo, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  createSocialAccount,
  deleteSocialAccount,
  fetchSiteSettings,
  fetchSocialAccounts,
  updateSiteSettings,
  verifySocialAccount,
} from "../../services/api";

const initialForm = {
  provider: "meta",
  label: "",
  accessToken: "",
  pageId: "",
  instagramBusinessAccountId: "",
  whatsappBusinessAccountId: "",
  whatsappPhoneNumberId: "",
  phoneNumber: "",
  status: "draft",
};

const setupTone = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  missing: "border-red-200 bg-red-50 text-red-700",
};

const SocialAccountsManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [publicWhatsAppNumber, setPublicWhatsAppNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadConnections = async () => {
    setLoading(true);
    setError("");
    try {
      const [accountsResponse, settingsResponse] = await Promise.all([
        fetchSocialAccounts(),
        fetchSiteSettings(),
      ]);
      setAccounts(Array.isArray(accountsResponse.data) ? accountsResponse.data : []);
      setPublicWhatsAppNumber(settingsResponse.data?.whatsapp || "");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load social account settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const metaAccounts = useMemo(
    () => accounts.filter((account) => account.provider === "meta"),
    [accounts]
  );
  const whatsappAccounts = useMemo(
    () => accounts.filter((account) => account.provider === "whatsapp"),
    [accounts]
  );
  const activeMetaAccounts = useMemo(
    () => metaAccounts.filter((account) => account.status === "active"),
    [metaAccounts]
  );
  const activeWhatsAppAccounts = useMemo(
    () => whatsappAccounts.filter((account) => account.status === "active"),
    [whatsappAccounts]
  );

  const instagramReadyAccount = useMemo(
    () =>
      activeMetaAccounts.find((account) => account.instagramBusinessAccountId) || null,
    [activeMetaAccounts]
  );
  const whatsappAutomationAccount = useMemo(
    () =>
      activeWhatsAppAccounts.find(
        (account) =>
          account.whatsappPhoneNumberId &&
          (account.phoneNumber || account.metadata?.verification?.displayPhoneNumber)
      ) || activeWhatsAppAccounts[0] || null,
    [activeWhatsAppAccounts]
  );

  const publicWhatsAppReady = Boolean(publicWhatsAppNumber?.trim());
  const whatsappAutomationReady = Boolean(whatsappAutomationAccount?.whatsappPhoneNumberId);

  const handleSaveConnection = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createSocialAccount(form);
      setForm(initialForm);
      setSuccess("Channel connection saved. Verify it next to activate publishing or automation.");
      await loadConnections();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save social account.");
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (accountId) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await verifySocialAccount(accountId);
      setSuccess("Connection verified successfully.");
      await loadConnections();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to verify social account.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (accountId) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await deleteSocialAccount(accountId);
      setSuccess("Connection removed.");
      await loadConnections();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete social account.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePublicNumber = async (event) => {
    event.preventDefault();
    setSettingsSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateSiteSettings({ whatsapp: publicWhatsAppNumber.trim() });
      setSuccess("Public WhatsApp number saved.");
      await loadConnections();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save the public WhatsApp number.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const setupChecklist = [
    {
      title: "Public WhatsApp button",
      description:
        "Used on the tenant website and inquiry share links so travelers can start a WhatsApp conversation.",
      state: publicWhatsAppReady ? "ready" : "warning",
      detail: publicWhatsAppReady
        ? `Website number: ${publicWhatsAppNumber}`
        : "Add the tenant's public WhatsApp number below.",
    },
    {
      title: "WhatsApp lead automation",
      description:
        "Used by Lead Inbox and Unified Inbox when operators click Send WhatsApp.",
      state: whatsappAutomationReady ? "ready" : "warning",
      detail: whatsappAutomationReady
        ? `Automation account: ${whatsappAutomationAccount.label}`
        : "Connect and verify a WhatsApp Business account with a Phone Number ID.",
    },
    {
      title: "Facebook publishing",
      description:
        "Used when the tenant publishes a post to Facebook from the Social Posts tab.",
      state: activeMetaAccounts.length > 0 ? "ready" : "warning",
      detail:
        activeMetaAccounts.length > 0
          ? `${activeMetaAccounts.length} active Meta connection${activeMetaAccounts.length === 1 ? "" : "s"}`
          : "Connect and verify a Meta account with a valid Facebook Page ID.",
    },
    {
      title: "Instagram publishing",
      description:
        "Requires the Meta connection to expose an Instagram Business Account ID.",
      state: instagramReadyAccount ? "ready" : activeMetaAccounts.length > 0 ? "warning" : "missing",
      detail: instagramReadyAccount
        ? `Instagram-ready account: ${instagramReadyAccount.label}`
        : "Reconnect Meta or add an Instagram Business Account ID before publishing to Instagram.",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Channel Accounts
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Social And WhatsApp Setup
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            This area controls both social publishing and WhatsApp lead automation. Meta is used
            for Facebook and Instagram posts. WhatsApp Business is used for lead follow-up
            messages from the inbox.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{accounts.length} Saved Connections</Badge>
          <Badge variant={whatsappAutomationReady ? "secondary" : "accent"}>
            {whatsappAutomationReady ? "WhatsApp Automation Ready" : "WhatsApp Setup Needed"}
          </Badge>
        </div>
      </div>

      {(error || success) && (
        <div
          className={`rounded-3xl border px-5 py-4 text-sm font-bold ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {setupChecklist.map((item) => (
          <div
            key={item.title}
            className={`rounded-[28px] border px-5 py-5 ${setupTone[item.state]}`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.25em]">
              {item.title}
            </p>
            <p className="mt-3 text-sm font-semibold leading-6">{item.description}</p>
            <p className="mt-4 text-xs font-black uppercase tracking-widest opacity-80">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-none p-8 shadow-xl">
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
            Public WhatsApp Number
          </h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            This is the number the tenant website shows to travelers. The platform uses it for the
            public WhatsApp button and for lead share links generated from website inquiries.
          </p>

          <form onSubmit={handleSavePublicNumber} className="mt-6 space-y-4">
            <input
              type="text"
              value={publicWhatsAppNumber}
              onChange={(event) => setPublicWhatsAppNumber(event.target.value)}
              placeholder="+255700000000"
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" disabled={settingsSaving}>
              {settingsSaving ? "Saving..." : "Save Public Number"}
            </Button>
          </form>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Important
            </p>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
              The public WhatsApp number and the WhatsApp Business API connection are related, but
              they are not the same thing. A tenant can use one public number on the website and a
              separate verified WhatsApp Business sender for operator automation if needed.
            </p>
          </div>
        </Card>

        <Card className="border-none p-8 shadow-xl">
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
            Connect Publishing Or Automation Account
          </h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Save a Meta connection for Facebook and Instagram publishing, or save a WhatsApp
            Business connection for lead automation in the inbox.
          </p>

          <form onSubmit={handleSaveConnection} className="mt-6 space-y-4">
            <select
              value={form.provider}
              onChange={(event) =>
                setForm((current) => ({ ...initialForm, provider: event.target.value }))
              }
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            >
              <option value="meta">Meta (Facebook / Instagram)</option>
              <option value="whatsapp">WhatsApp Business</option>
            </select>
            <input
              type="text"
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              placeholder="Connection label"
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            />
            <textarea
              rows={3}
              value={form.accessToken}
              onChange={(event) => setForm((current) => ({ ...current, accessToken: event.target.value }))}
              placeholder="Long-lived access token"
              className="w-full rounded-[24px] border-none bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary"
            />

            {form.provider === "meta" ? (
              <>
                <input
                  type="text"
                  value={form.pageId}
                  onChange={(event) => setForm((current) => ({ ...current, pageId: event.target.value }))}
                  placeholder="Facebook Page ID"
                  className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  value={form.instagramBusinessAccountId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      instagramBusinessAccountId: event.target.value,
                    }))
                  }
                  placeholder="Instagram Business Account ID (optional for Facebook-only)"
                  className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
                />
                <div className="rounded-[24px] border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-medium leading-6 text-sky-800">
                  Use a Meta connection that can manage the tenant's Facebook Page. If the tenant
                  also wants Instagram publishing, the Page must be linked to an Instagram Business
                  account.
                </div>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={form.whatsappBusinessAccountId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      whatsappBusinessAccountId: event.target.value,
                    }))
                  }
                  placeholder="WhatsApp Business Account ID"
                  className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  value={form.whatsappPhoneNumberId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      whatsappPhoneNumberId: event.target.value,
                    }))
                  }
                  placeholder="WhatsApp Phone Number ID"
                  className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  value={form.phoneNumber}
                  onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                  placeholder="Display phone number"
                  className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
                />
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium leading-6 text-emerald-800">
                  WhatsApp automation needs a valid access token plus the WhatsApp Phone Number ID.
                  After saving, click Verify so the platform can confirm the phone number and mark
                  the account active for Lead Inbox and Unified Inbox sending.
                </div>
              </>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Connection"}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="border-none p-8 shadow-xl">
        <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
          Existing Connections
        </h3>
        <div className="space-y-4">
          {loading && <p className="text-sm font-medium text-slate-500">Loading accounts...</p>}
          {!loading && accounts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
              No tenant social or WhatsApp automation accounts connected yet.
            </div>
          )}
          {!loading &&
            accounts.map((account) => {
              const verification = account.metadata?.verification || {};
              const displayPhone =
                account.phoneNumber || verification.displayPhoneNumber || "Missing";

              return (
                <div
                  key={account._id}
                  className="rounded-[28px] border border-slate-200 bg-white px-5 py-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-900">
                        {account.label}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="primary">{account.provider}</Badge>
                        <Badge variant={account.status === "active" ? "secondary" : "accent"}>
                          {account.status}
                        </Badge>
                        <Badge variant="luxury">
                          {account.provider === "meta"
                            ? "Used for Facebook and Instagram publishing"
                            : "Used for WhatsApp lead messaging"}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-1 text-sm font-medium text-slate-500">
                        {account.provider === "meta" ? (
                          <>
                            <p>Facebook Page ID: {account.pageId || "Missing"}</p>
                            <p>Facebook Page Name: {verification.pageName || "Not confirmed yet"}</p>
                            <p>
                              Instagram Business ID: {account.instagramBusinessAccountId || verification.instagramBusinessAccountId || "Missing"}
                            </p>
                            <p>
                              Instagram Username: {verification.instagramUsername || "Not linked"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>WhatsApp Business ID: {account.whatsappBusinessAccountId || "Missing"}</p>
                            <p>Phone Number ID: {account.whatsappPhoneNumberId || "Missing"}</p>
                            <p>Display Phone: {displayPhone}</p>
                            <p>Verified Name: {verification.verifiedName || "Not confirmed yet"}</p>
                            <p>Quality Rating: {verification.qualityRating || "Not confirmed yet"}</p>
                          </>
                        )}
                      </div>

                      {account.lastVerifiedAt && (
                        <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                          Verified {new Date(account.lastVerifiedAt).toLocaleString()}
                        </p>
                      )}

                      {account.lastError && (
                        <p className="mt-3 text-sm font-medium text-red-600">{account.lastError}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleVerify(account._id)}
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white"
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(account._id)}
                        className="rounded-2xl border border-red-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
};

export default SocialAccountsManager;
