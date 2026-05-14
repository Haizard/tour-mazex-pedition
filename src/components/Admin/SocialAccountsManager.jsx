import { useEffect, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  createSocialAccount,
  deleteSocialAccount,
  fetchSocialAccounts,
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

const SocialAccountsManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAccounts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchSocialAccounts();
      setAccounts(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load social accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createSocialAccount(form);
      setForm(initialForm);
      await loadAccounts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save social account.");
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (accountId) => {
    setSaving(true);
    setError("");
    try {
      await verifySocialAccount(accountId);
      await loadAccounts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to verify social account.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (accountId) => {
    setSaving(true);
    setError("");
    try {
      await deleteSocialAccount(accountId);
      await loadAccounts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete social account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Channel Accounts
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Tenant Social Connections
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Connect each tenant's own Meta and WhatsApp Business credentials so publishing and
            messaging run from the correct tenant-owned account.
          </p>
        </div>
        <Badge variant="primary">{accounts.length} Connected Accounts</Badge>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Connect Account
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <select
              value={form.provider}
              onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
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
                  placeholder="Instagram Business Account ID"
                  className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
                />
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
              </>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Connection"}
            </Button>
          </form>
        </Card>

        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Existing Connections
          </h3>
          <div className="space-y-4">
            {loading && <p className="text-sm font-medium text-slate-500">Loading accounts...</p>}
            {!loading && accounts.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
                No tenant social accounts connected yet.
              </div>
            )}
            {!loading &&
              accounts.map((account) => (
                <div key={account._id} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
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
                            <p>
                              Instagram Business ID: {account.instagramBusinessAccountId || "Missing"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>WhatsApp Business ID: {account.whatsappBusinessAccountId || "Missing"}</p>
                            <p>Phone Number ID: {account.whatsappPhoneNumberId || "Missing"}</p>
                          </>
                        )}
                      </div>
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
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SocialAccountsManager;
