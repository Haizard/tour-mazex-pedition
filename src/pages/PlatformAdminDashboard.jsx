import React, { useEffect, useMemo, useState } from "react";
import {
  createPlatformTenant,
  fetchPlatformSummary,
  fetchPlatformTenantMarketing,
  fetchPlatformTenantSupport,
  fetchPlatformTenants,
  markPlatformTenantDomainVerified,
  renewPlatformTenantDomainService,
  updatePlatformTenant,
  updatePlatformTenantAdmin,
} from "../services/api";
import { usePlatformAdminAuth } from "../context/PlatformAdminAuthContext";

const metricCards = [
  { key: "tenantCount", label: "Tenants" },
  { key: "activeTenantCount", label: "Active Tenants" },
  { key: "tenantAdminCount", label: "Tenant Admins" },
  { key: "emailConnectionCount", label: "Email Connections" },
  { key: "inquiryCount", label: "Inquiries" },
  { key: "contactMessageCount", label: "Contact Messages" },
  { key: "openThreadCount", label: "Open Inbox Threads" },
  { key: "socialAccountCount", label: "Social Accounts" },
  { key: "socialPostCount", label: "Social Posts" },
  { key: "campaignCount", label: "Campaigns" },
];

const createTenantFormState = (tenant) => ({
  name: tenant?.name || "",
  subdomain: tenant?.subdomain || "",
  status: tenant?.status || "active",
  adminUsername: tenant?.admins?.[0]?.username || "",
  adminDisplayName: tenant?.admins?.[0]?.displayName || "",
  adminStatus: tenant?.admins?.[0]?.status || "active",
  adminPassword: "",
  customDomains: (tenant?.customDomains || []).join("\n"),
  requestedCustomDomains: (tenant?.requestedCustomDomains || []).join("\n"),
  enableCustomDomains: Boolean(tenant?.features?.enableCustomDomains),
  enablePageBuilder: Boolean(tenant?.features?.enablePageBuilder),
  enableAiContent: tenant?.features?.enableAiContent !== false,
  subscriptionPlan: tenant?.subscription?.plan || "starter",
  subscriptionStatus: tenant?.subscription?.status || "inactive",
  billingInterval: tenant?.subscription?.billingInterval || "monthly",
  trialEndsAt: tenant?.subscription?.trialEndsAt
    ? new Date(tenant.subscription.trialEndsAt).toISOString().slice(0, 10)
    : "",
  currentPeriodEndsAt: tenant?.subscription?.currentPeriodEndsAt
    ? new Date(tenant.subscription.currentPeriodEndsAt).toISOString().slice(0, 10)
    : "",
  manualOverride: tenant?.subscription?.manualOverride !== false,
  domainServiceStatus: tenant?.domainService?.serviceStatus || "active",
  annualDomainPriceUsd: String(tenant?.domainService?.annualPriceUsd || 50),
  domainRenewalDueAt: tenant?.domainService?.renewalDueAt
    ? new Date(tenant.domainService.renewalDueAt).toISOString().slice(0, 10)
    : "",
  includesHosting: tenant?.domainService?.includesHosting !== false,
  includesManagedDns: tenant?.domainService?.includesManagedDns !== false,
});

const createNewTenantState = () => ({
  name: "",
  subdomain: "",
  adminUsername: "tenant",
  adminPassword: "tenant123",
  subscriptionPlan: "starter",
  subscriptionStatus: "trialing",
  annualDomainPriceUsd: "50",
});

const PlatformAdminDashboard = () => {
  const { logout, platformAdmin } = usePlatformAdminAuth();
  const [summary, setSummary] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [tenantForm, setTenantForm] = useState(createTenantFormState());
  const [newTenantForm, setNewTenantForm] = useState(createNewTenantState());
  const [supportDetail, setSupportDetail] = useState(null);
  const [marketingDetail, setMarketingDetail] = useState(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportMode, setSupportMode] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [renewingDomain, setRenewingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant._id === selectedTenantId) || null,
    [selectedTenantId, tenants]
  );

  const loadPlatformData = async (preferredTenantId = "") => {
    setLoading(true);
    setError("");

    try {
      const [summaryResponse, tenantsResponse] = await Promise.all([
        fetchPlatformSummary(),
        fetchPlatformTenants(),
      ]);

      const nextSummary = summaryResponse.data?.summary || null;
      const nextTenants = tenantsResponse.data || tenantsResponse.data?.tenants || [];
      const normalizedTenants = Array.isArray(nextTenants)
        ? nextTenants
        : nextTenants.tenants || [];

      setSummary(nextSummary);
      setTenants(normalizedTenants);

      const nextSelectedTenant =
        normalizedTenants.find((tenant) => tenant._id === preferredTenantId) ||
        normalizedTenants[0] ||
        null;

      setSelectedTenantId(nextSelectedTenant?._id || "");
      setTenantForm(createTenantFormState(nextSelectedTenant));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load platform data right now."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  useEffect(() => {
    setTenantForm(createTenantFormState(selectedTenant));
  }, [selectedTenant]);

  useEffect(() => {
    const loadSupportDetail = async () => {
      if (!selectedTenantId) {
        setSupportDetail(null);
        return;
      }

      setSupportLoading(true);

      try {
        const response = await fetchPlatformTenantSupport(selectedTenantId, {
          mode: supportMode,
        });
        setSupportDetail(response.data?.support || null);
      } catch (_error) {
        setSupportDetail(null);
      } finally {
        setSupportLoading(false);
      }
    };

    loadSupportDetail();
  }, [selectedTenantId, supportMode]);

  useEffect(() => {
    const loadMarketingDetail = async () => {
      if (!selectedTenantId) {
        setMarketingDetail(null);
        return;
      }

      try {
        const response = await fetchPlatformTenantMarketing(selectedTenantId);
        setMarketingDetail(response.data?.marketing || null);
      } catch (_error) {
        setMarketingDetail(null);
      }
    };

    loadMarketingDetail();
  }, [selectedTenantId]);

  const handleSaveTenant = async (event) => {
    event.preventDefault();

    if (!selectedTenant) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await updatePlatformTenant(selectedTenant._id, {
        name: tenantForm.name,
        subdomain: tenantForm.subdomain,
        status: tenantForm.status,
        customDomains: tenantForm.customDomains
          .split("\n")
          .map((domain) => domain.trim())
          .filter(Boolean),
        features: {
          ...selectedTenant.features,
          enableCustomDomains: tenantForm.enableCustomDomains,
          enablePageBuilder: tenantForm.enablePageBuilder,
          enableAiContent: tenantForm.enableAiContent,
        },
        subscription: {
          ...(selectedTenant.subscription || {}),
          plan: tenantForm.subscriptionPlan,
          status: tenantForm.subscriptionStatus,
          billingInterval: tenantForm.billingInterval,
          trialEndsAt: tenantForm.trialEndsAt || null,
          currentPeriodEndsAt: tenantForm.currentPeriodEndsAt || null,
          manualOverride: tenantForm.manualOverride,
        },
        requestedCustomDomains: tenantForm.requestedCustomDomains
          .split("\n")
          .map((domain) => domain.trim())
          .filter(Boolean),
        domainService: {
          ...(selectedTenant.domainService || {}),
          serviceStatus: tenantForm.domainServiceStatus,
          annualPriceUsd: Number(tenantForm.annualDomainPriceUsd || 50),
          renewalDueAt: tenantForm.domainRenewalDueAt || null,
          includesHosting: tenantForm.includesHosting,
          includesManagedDns: tenantForm.includesManagedDns,
        },
      });

      if (tenantForm.adminUsername || tenantForm.adminPassword) {
        await updatePlatformTenantAdmin(selectedTenant._id, {
          username: tenantForm.adminUsername,
          displayName: tenantForm.adminDisplayName,
          status: tenantForm.adminStatus,
          password: tenantForm.adminPassword,
        });
      }

      setNotice("Tenant settings updated.");
      await loadPlatformData(selectedTenant._id);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to save tenant settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTenant = async (event) => {
    event.preventDefault();
    setCreatingTenant(true);
    setError("");
    setNotice("");

    try {
      const response = await createPlatformTenant({
        name: newTenantForm.name,
        subdomain: newTenantForm.subdomain,
        adminUsername: newTenantForm.adminUsername,
        adminPassword: newTenantForm.adminPassword,
        subscription: {
          plan: newTenantForm.subscriptionPlan,
          status: newTenantForm.subscriptionStatus,
          billingInterval: "monthly",
          manualOverride: true,
        },
        domainService: {
          annualPriceUsd: Number(newTenantForm.annualDomainPriceUsd || 50),
          serviceStatus: "active",
          includesHosting: true,
          includesManagedDns: true,
        },
      });

      const createdTenant = response.data?.tenant;
      const credentials = response.data?.credentials;
      setNotice(
        `Tenant created with demo domain ${createdTenant?.demoDomain || "pending"} and admin username ${credentials?.adminUsername}.`
      );
      setNewTenantForm(createNewTenantState());
      await loadPlatformData(createdTenant?._id || "");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to create the tenant right now."
      );
    } finally {
      setCreatingTenant(false);
    }
  };

  const handleRenewDomainService = async () => {
    if (!selectedTenant) {
      return;
    }

    setRenewingDomain(true);
    setError("");
    setNotice("");

    try {
      await renewPlatformTenantDomainService(selectedTenant._id, {
        annualPriceUsd: Number(tenantForm.annualDomainPriceUsd || 50),
      });
      setNotice("Domain service renewed for another year.");
      await loadPlatformData(selectedTenant._id);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to renew the domain service."
      );
    } finally {
      setRenewingDomain(false);
    }
  };

  const handleMarkVerified = async (domain) => {
    if (!selectedTenant || !domain) {
      return;
    }

    setVerifyingDomain(domain);
    setError("");
    setNotice("");

    try {
      await markPlatformTenantDomainVerified(selectedTenant._id, domain);
      setNotice(`${domain} marked as verified.`);
      await loadPlatformData(selectedTenant._id);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to mark the domain as verified."
      );
    } finally {
      setVerifyingDomain("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10 md:px-10 lg:px-14">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-cyan-300 font-black uppercase tracking-[0.3em] text-xs mb-3">
              Platform Console
            </p>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-3">
              Tenant Operations
            </h1>
            <p className="text-slate-400 max-w-2xl font-medium">
              This control plane now shows the platform footprint and lets us
              start managing subdomains, custom domains, and tenant feature
              flags from one place.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 min-w-[280px]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">
              Signed In
            </p>
            <p className="text-xl font-black">
              {platformAdmin?.displayName || platformAdmin?.username}
            </p>
            <p className="text-sm text-slate-400 font-medium uppercase tracking-[0.2em]">
              {platformAdmin?.role?.replace(/_/g, " ") || "platform admin"}
            </p>
            <button
              onClick={logout}
              className="mt-4 inline-flex px-4 py-2 rounded-2xl border border-cyan-400/30 text-cyan-200 hover:bg-cyan-400/10 transition text-xs font-black uppercase tracking-widest"
            >
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-100 font-medium">
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-emerald-100 font-medium">
            {notice}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {metricCards.map((card) => (
            <div
              key={card.key}
              className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-900/70 p-6 shadow-2xl shadow-black/20"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-4">
                {card.label}
              </p>
              <p className="text-4xl font-black text-white">
                {loading ? "..." : summary?.[card.key] ?? 0}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">
                Tenant Provisioning
              </p>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                Create New Tenant With Demo Domain
              </h2>
            </div>
            <div className="text-xs font-black uppercase tracking-widest text-cyan-300">
              Managed domain and hosting service
            </div>
          </div>

          <form onSubmit={handleCreateTenant} className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <input
              type="text"
              value={newTenantForm.name}
              onChange={(event) =>
                setNewTenantForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Tenant business name"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 font-bold text-white outline-none focus:border-cyan-400/50"
            />
            <input
              type="text"
              value={newTenantForm.subdomain}
              onChange={(event) =>
                setNewTenantForm((current) => ({
                  ...current,
                  subdomain: event.target.value.toLowerCase(),
                }))
              }
              placeholder="Demo subdomain"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 font-bold text-white outline-none focus:border-cyan-400/50"
            />
            <input
              type="text"
              value={newTenantForm.adminUsername}
              onChange={(event) =>
                setNewTenantForm((current) => ({
                  ...current,
                  adminUsername: event.target.value.toLowerCase(),
                }))
              }
              placeholder="Tenant admin username"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 font-bold text-white outline-none focus:border-cyan-400/50"
            />
            <input
              type="text"
              value={newTenantForm.adminPassword}
              onChange={(event) =>
                setNewTenantForm((current) => ({ ...current, adminPassword: event.target.value }))
              }
              placeholder="Tenant admin password"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 font-bold text-white outline-none focus:border-cyan-400/50"
            />
            <select
              value={newTenantForm.subscriptionPlan}
              onChange={(event) =>
                setNewTenantForm((current) => ({
                  ...current,
                  subscriptionPlan: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs font-black uppercase text-white outline-none focus:border-cyan-400/50"
            >
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={newTenantForm.subscriptionStatus}
              onChange={(event) =>
                setNewTenantForm((current) => ({
                  ...current,
                  subscriptionStatus: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs font-black uppercase text-white outline-none focus:border-cyan-400/50"
            >
              <option value="trialing">Trialing</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <input
              type="number"
              min="50"
              max="200"
              value={newTenantForm.annualDomainPriceUsd}
              onChange={(event) =>
                setNewTenantForm((current) => ({
                  ...current,
                  annualDomainPriceUsd: event.target.value,
                }))
              }
              placeholder="Annual domain service price"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 font-bold text-white outline-none focus:border-cyan-400/50 xl:col-span-2"
            />
            <button
              type="submit"
              disabled={creatingTenant}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-lime-400 py-4 font-black uppercase tracking-widest text-slate-950 disabled:opacity-50"
            >
              {creatingTenant ? "Creating Tenant..." : "Create Tenant"}
            </button>
          </form>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">
                  Tenant Inventory
                </p>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Current Tenant Footprint
                </h2>
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-cyan-300">
                {tenants.length} visible
              </div>
            </div>

            <div className="space-y-4">
              {tenants.map((tenant) => (
                <button
                  key={tenant._id}
                  onClick={() => {
                    setSelectedTenantId(tenant._id);
                    setNotice("");
                    setSupportMode("recent");
                  }}
                  className={`w-full text-left rounded-[28px] border p-5 transition ${
                    selectedTenantId === tenant._id
                      ? "border-cyan-400/40 bg-cyan-400/10"
                      : "border-white/10 bg-slate-900/60 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-black text-lg text-white">{tenant.name}</p>
                      <p className="text-sm text-slate-400 font-medium">{tenant.slug}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tenant.demoDomain && (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-200 text-xs font-black">
                            {tenant.demoDomain}
                          </span>
                        )}
                        {(tenant.customDomains || []).slice(0, 2).map((domain) => (
                          <span
                            key={domain}
                            className="px-3 py-1 rounded-full bg-white/5 text-cyan-200 text-xs font-black"
                          >
                            {domain}
                          </span>
                        ))}
                        {!tenant.customDomains?.length && (
                          <span className="px-3 py-1 rounded-full bg-white/5 text-slate-500 text-xs font-black">
                            No custom domains
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 text-xs font-black uppercase tracking-widest">
                        {tenant.status || "active"}
                      </span>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
                        {tenant.subscription?.plan || "starter"} / {tenant.subscription?.status || "inactive"}
                      </p>
                      <div className="mt-3 text-xs text-slate-400 font-medium space-y-1">
                        <p>${tenant.domainService?.annualPriceUsd ?? 50} / year domain service</p>
                        <p>renewal due {tenant.domainService?.renewalDueAt ? new Date(tenant.domainService.renewalDueAt).toLocaleDateString() : "not set"}</p>
                        <p>login: {tenant.admins?.[0]?.username || "not set"}</p>
                        <p>{tenant.adminCount ?? tenant.metrics?.admins ?? 0} admins</p>
                        <p>{tenant.pageConfigCount ?? tenant.metrics?.pageConfigs ?? 0} pages</p>
                        <p>{tenant.emailConnectionCount ?? tenant.metrics?.emailConnections ?? 0} inbox links</p>
                        <p>{tenant.inquiryCount ?? tenant.metrics?.inquiries ?? 0} inquiries</p>
                        <p>{tenant.contactMessageCount ?? tenant.metrics?.contactMessages ?? 0} contact messages</p>
                        <p>{tenant.openThreadCount ?? tenant.metrics?.openThreads ?? 0} open threads</p>
                        <p>{tenant.socialAccountCount ?? tenant.metrics?.socialAccounts ?? 0} social accounts</p>
                        <p>{tenant.socialPostCount ?? tenant.metrics?.socialPosts ?? 0} social posts</p>
                        <p>{tenant.campaignCount ?? tenant.metrics?.campaigns ?? 0} campaigns</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {!loading && tenants.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-5 py-10 text-center text-slate-400 font-medium">
                  No tenants are available yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 md:p-8 space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">
                Tenant Controls
              </p>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                Domain And Subscription Management
              </h2>
            </div>

            {!selectedTenant && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-5 py-8 text-slate-400 font-medium">
                Select a tenant to manage subdomains, custom domains, and feature flags.
              </div>
            )}

            {selectedTenant && (
              <form onSubmit={handleSaveTenant} className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
                  <p className="text-lg font-black text-white">{selectedTenant.name}</p>
                  <p className="text-sm text-slate-400 font-medium mt-1">
                    Legacy tenant fallback remains intact while custom domains and
                    dedicated subdomains are configured here.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                      Demo domain: {selectedTenant.demoDomain || "pending"}
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-cyan-200">
                      Domain service: {selectedTenant.domainService?.serviceStatus || "active"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5 md:col-span-2">
                    <div className="mb-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
                        Tenant Login Access
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-300">
                        Set the username and reset the password used at{" "}
                        <span className="font-black text-white">
                          {selectedTenant.demoDomain || "tenant demo"}/login
                        </span>
                        .
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        value={tenantForm.adminUsername}
                        onChange={(event) =>
                          setTenantForm((current) => ({
                            ...current,
                            adminUsername: event.target.value.toLowerCase(),
                          }))
                        }
                        placeholder="Tenant login username"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 font-bold text-white outline-none focus:border-cyan-400/50"
                      />
                      <input
                        type="text"
                        value={tenantForm.adminPassword}
                        onChange={(event) =>
                          setTenantForm((current) => ({
                            ...current,
                            adminPassword: event.target.value,
                          }))
                        }
                        placeholder="New password (leave blank to keep current)"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 font-bold text-white outline-none focus:border-cyan-400/50"
                      />
                      <input
                        type="text"
                        value={tenantForm.adminDisplayName}
                        onChange={(event) =>
                          setTenantForm((current) => ({
                            ...current,
                            adminDisplayName: event.target.value,
                          }))
                        }
                        placeholder="Display name"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 font-bold text-white outline-none focus:border-cyan-400/50"
                      />
                      <select
                        value={tenantForm.adminStatus}
                        onChange={(event) =>
                          setTenantForm((current) => ({
                            ...current,
                            adminStatus: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs font-black uppercase text-white outline-none focus:border-cyan-400/50"
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>

                  <select
                    value={tenantForm.subscriptionPlan}
                    onChange={(event) =>
                      setTenantForm((current) => ({
                        ...current,
                        subscriptionPlan: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs font-black uppercase text-white outline-none focus:border-cyan-400/50"
                  >
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>

                  <select
                    value={tenantForm.subscriptionStatus}
                    onChange={(event) =>
                      setTenantForm((current) => ({
                        ...current,
                        subscriptionStatus: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs font-black uppercase text-white outline-none focus:border-cyan-400/50"
                  >
                    <option value="inactive">Inactive</option>
                    <option value="trialing">Trialing</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select
                    value={tenantForm.billingInterval}
                    onChange={(event) =>
                      setTenantForm((current) => ({
                        ...current,
                        billingInterval: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs font-black uppercase text-white outline-none focus:border-cyan-400/50"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>

                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
                    <span className="text-sm font-bold text-slate-200">Manual override enabled</span>
                    <input
                      type="checkbox"
                      checked={tenantForm.manualOverride}
                      onChange={(event) =>
                        setTenantForm((current) => ({
                          ...current,
                          manualOverride: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-cyan-400"
                    />
                  </label>

                  <input
                    type="date"
                    value={tenantForm.trialEndsAt}
                    onChange={(event) =>
                      setTenantForm((current) => ({
                        ...current,
                        trialEndsAt: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 font-bold text-white outline-none focus:border-cyan-400/50"
                  />

                  <input
                    type="date"
                    value={tenantForm.currentPeriodEndsAt}
                    onChange={(event) =>
                      setTenantForm((current) => ({
                        ...current,
                        currentPeriodEndsAt: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 font-bold text-white outline-none focus:border-cyan-400/50"
                  />
                </div>

                <input
                  type="text"
                  value={tenantForm.name}
                  onChange={(event) =>
                    setTenantForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Tenant name"
                  className="w-full bg-slate-900/60 border border-white/10 p-4 rounded-2xl font-bold text-white outline-none focus:border-cyan-400/50"
                />

                <input
                  type="text"
                  value={tenantForm.subdomain}
                  onChange={(event) =>
                    setTenantForm((current) => ({
                      ...current,
                      subdomain: event.target.value.toLowerCase(),
                    }))
                  }
                  placeholder="Subdomain"
                  className="w-full bg-slate-900/60 border border-white/10 p-4 rounded-2xl font-bold text-white outline-none focus:border-cyan-400/50"
                />

                <textarea
                  rows={4}
                  value={tenantForm.customDomains}
                  onChange={(event) =>
                    setTenantForm((current) => ({
                      ...current,
                      customDomains: event.target.value,
                    }))
                  }
                  placeholder="One custom domain per line"
                  className="w-full bg-slate-900/60 border border-white/10 p-4 rounded-2xl font-medium text-white outline-none focus:border-cyan-400/50"
                />

                <textarea
                  rows={3}
                  value={tenantForm.requestedCustomDomains}
                  onChange={(event) =>
                    setTenantForm((current) => ({
                      ...current,
                      requestedCustomDomains: event.target.value,
                    }))
                  }
                  placeholder="Requested custom domains from tenant"
                  className="w-full bg-slate-900/60 border border-white/10 p-4 rounded-2xl font-medium text-white outline-none focus:border-cyan-400/50"
                />

                <select
                  value={tenantForm.status}
                  onChange={(event) =>
                    setTenantForm((current) => ({ ...current, status: event.target.value }))
                  }
                  className="w-full bg-slate-900/60 border border-white/10 p-4 rounded-2xl font-black uppercase text-xs text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </select>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    ["enableCustomDomains", "Enable custom domains"],
                    ["enablePageBuilder", "Enable page builder"],
                    ["enableAiContent", "Enable AI content"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3"
                    >
                      <span className="text-sm font-bold text-slate-200">{label}</span>
                      <input
                        type="checkbox"
                        checked={tenantForm[key]}
                        onChange={(event) =>
                          setTenantForm((current) => ({
                            ...current,
                            [key]: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-cyan-400"
                      />
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <select
                    value={tenantForm.domainServiceStatus}
                    onChange={(event) =>
                      setTenantForm((current) => ({
                        ...current,
                        domainServiceStatus: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs font-black uppercase text-white outline-none focus:border-cyan-400/50"
                  >
                    <option value="active">Active</option>
                    <option value="pending_renewal">Pending Renewal</option>
                    <option value="expired">Expired</option>
                  </select>

                  <input
                    type="number"
                    min="50"
                    max="200"
                    value={tenantForm.annualDomainPriceUsd}
                    onChange={(event) =>
                      setTenantForm((current) => ({
                        ...current,
                        annualDomainPriceUsd: event.target.value,
                      }))
                    }
                    placeholder="Annual domain service USD"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 font-bold text-white outline-none focus:border-cyan-400/50"
                  />

                  <input
                    type="date"
                    value={tenantForm.domainRenewalDueAt}
                    onChange={(event) =>
                      setTenantForm((current) => ({
                        ...current,
                        domainRenewalDueAt: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 font-bold text-white outline-none focus:border-cyan-400/50"
                  />

                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
                    <span className="text-sm font-bold text-slate-200">Managed DNS included</span>
                    <input
                      type="checkbox"
                      checked={tenantForm.includesManagedDns}
                      onChange={(event) =>
                        setTenantForm((current) => ({
                          ...current,
                          includesManagedDns: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-cyan-400"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 md:col-span-2">
                    <span className="text-sm font-bold text-slate-200">Hosting included in annual charge</span>
                    <input
                      type="checkbox"
                      checked={tenantForm.includesHosting}
                      onChange={(event) =>
                        setTenantForm((current) => ({
                          ...current,
                          includesHosting: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-cyan-400"
                    />
                  </label>
                </div>

                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-black mb-2">
                    Current Scope
                  </p>
                  <p className="text-sm text-slate-300 font-medium">
                    This is the first domain-management layer. It updates tenant
                    routing fields and feature flags, but DNS verification and
                    provisioning automation are still the next platform step.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-black mb-2">
                      Verification Workflow
                    </p>
                    <p className="text-sm text-slate-300 font-medium">
                      Each custom domain now gets a stored verification record with
                      a generated TXT instruction and status. This is still a
                      scaffold, so verification is manually confirmed from the console.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black mb-1">
                      Subdomain Status
                    </p>
                    <p className="text-sm font-bold text-white">
                      {selectedTenant.subdomain || "No subdomain configured"}
                    </p>
                    <p className="text-xs text-cyan-300 font-black uppercase tracking-widest mt-2">
                      {selectedTenant.subdomainStatus || "unconfigured"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {(selectedTenant.customDomainRecords || []).map((record) => (
                      <div
                        key={record.domain}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-white">{record.domain}</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">
                              Add a <span className="font-black text-slate-200">{record.verificationType}</span> record:
                              {" "}
                              <span className="text-cyan-300">{record.verificationHost}</span>
                              {" "}
                              →{" "}
                              <span className="text-cyan-300 break-all">{record.verificationValue}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium mt-2">
                              Expected target after routing cutover: {record.expectedTarget}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                record.status === "verified"
                                  ? "bg-emerald-500/15 text-emerald-200"
                                  : record.status === "error"
                                    ? "bg-red-500/15 text-red-200"
                                    : "bg-amber-500/15 text-amber-200"
                              }`}
                            >
                              {record.status}
                            </span>
                            <button
                              type="button"
                              disabled={verifyingDomain === record.domain || record.status === "verified"}
                              onClick={() => handleMarkVerified(record.domain)}
                              className="block mt-3 text-[10px] font-black uppercase tracking-widest text-cyan-300 disabled:text-slate-500"
                            >
                              {verifyingDomain === record.domain
                                ? "Verifying..."
                                : record.status === "verified"
                                  ? "Verified"
                                  : "Mark Verified"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {!selectedTenant.customDomainRecords?.length && (
                      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-500 font-medium">
                        Add one or more custom domains above and save to generate
                        verification instructions here.
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-black py-4 rounded-2xl uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? "Saving Tenant..." : "Save Tenant Settings"}
                </button>

                <button
                  type="button"
                  disabled={renewingDomain}
                  onClick={handleRenewDomainService}
                  className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-400/10 py-4 font-black uppercase tracking-widest text-emerald-200 disabled:opacity-50"
                >
                  {renewingDomain ? "Renewing Domain..." : "Renew Domain And Hosting For 1 Year"}
                </button>
              </form>
            )}

            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">
                Capability Flags
              </p>
              {Object.entries(summary?.capabilities || {}).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-black text-white">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (letter) => letter.toUpperCase())}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {value ? "Backed by live code" : "Not available yet"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                      value
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-amber-500/15 text-amber-200"
                    }`}
                  >
                    {value ? "Ready" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">
                Marketing Visibility
              </p>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                Tenant Social Operations
              </h2>
            </div>
          </div>

          {!selectedTenant && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-5 py-8 text-slate-400 font-medium">
              Select a tenant to inspect connected social accounts, campaigns, posts, and lead activity.
            </div>
          )}

          {selectedTenant && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="rounded-[28px] border border-white/10 bg-slate-900/60 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-3">
                  Accounts
                </p>
                <div className="space-y-3">
                  {(marketingDetail?.socialAccounts || []).map((account) => (
                    <div key={account._id} className="rounded-2xl bg-white/5 px-4 py-3">
                      <p className="font-black text-white text-sm">{account.label}</p>
                      <p className="text-xs text-slate-400 uppercase font-black mt-1">
                        {account.provider} / {account.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-900/60 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-3">
                  Social Posts
                </p>
                <div className="space-y-3">
                  {(marketingDetail?.socialPosts || []).map((post) => (
                    <div key={post._id} className="rounded-2xl bg-white/5 px-4 py-3">
                      <p className="font-black text-white text-sm">{post.title}</p>
                      <p className="text-xs text-slate-400 uppercase font-black mt-1">
                        {post.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-900/60 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-3">
                  Campaigns
                </p>
                <div className="space-y-3">
                  {(marketingDetail?.campaigns || []).map((campaign) => (
                    <div key={campaign._id} className="rounded-2xl bg-white/5 px-4 py-3">
                      <p className="font-black text-white text-sm">{campaign.title}</p>
                      <p className="text-xs text-slate-400 uppercase font-black mt-1">
                        {campaign.campaignType} / {campaign.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-900/60 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-3">
                  Recent Leads
                </p>
                <div className="space-y-3">
                  {(marketingDetail?.inquiries || []).map((inquiry) => (
                    <div key={inquiry._id} className="rounded-2xl bg-white/5 px-4 py-3">
                      <p className="font-black text-white text-sm">{inquiry.name}</p>
                      <p className="text-xs text-slate-400 uppercase font-black mt-1">
                        {inquiry.sourceChannel} / {inquiry.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">
                Tenant Support
              </p>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                Support Workload Snapshot
              </h2>
            </div>

            <div className="space-y-4">
              {tenants
                .slice()
                .sort(
                  (left, right) =>
                    (right.openThreadCount ?? right.metrics?.openThreads ?? 0) -
                    (left.openThreadCount ?? left.metrics?.openThreads ?? 0)
                )
                .map((tenant) => (
                  <div
                    key={`support-${tenant._id}`}
                    className="rounded-3xl border border-white/10 bg-slate-900/60 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black text-white">{tenant.name}</p>
                        <p className="text-sm text-slate-400 font-medium mt-1">
                          {tenant.slug}
                        </p>
                      </div>
                      <span className="inline-flex px-3 py-1 rounded-full bg-cyan-400/15 text-cyan-200 text-xs font-black uppercase tracking-widest">
                        {(tenant.openThreadCount ?? tenant.metrics?.openThreads ?? 0)} open
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                      <div className="rounded-2xl bg-white/5 px-3 py-3">
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-black">Inbox</p>
                        <p className="text-xl font-black text-white mt-2">
                          {tenant.openThreadCount ?? tenant.metrics?.openThreads ?? 0}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-3 py-3">
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-black">Inquiry</p>
                        <p className="text-xl font-black text-white mt-2">
                          {tenant.inquiryCount ?? tenant.metrics?.inquiries ?? 0}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-3 py-3">
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-black">Contact</p>
                        <p className="text-xl font-black text-white mt-2">
                          {tenant.contactMessageCount ?? tenant.metrics?.contactMessages ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">
                Super Admin Access
              </p>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                Panel Routes
              </h2>
            </div>

            <div className="space-y-4 text-sm text-slate-300 font-medium">
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black mb-2">
                  Login Route
                </p>
                <p className="font-black text-cyan-300">/super-admin/login</p>
                <p className="text-slate-400 mt-2">
                  Alias of the platform admin login so the super-admin panel is easier to find.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black mb-2">
                  Dashboard Route
                </p>
                <p className="font-black text-cyan-300">/super-admin</p>
                <p className="text-slate-400 mt-2">
                  Opens the platform control plane with tenant operations, domains, inbox health, and support workload.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">
                  Support Detail
                </p>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Selected Tenant Activity
                </h2>
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-cyan-300">
                {selectedTenant?.name || "No tenant selected"}
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              {[
                ["recent", "Recent Activity"],
                ["unresolved", "Needs Action"],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSupportMode(mode)}
                  className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${
                    supportMode === mode
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-slate-900/60 text-slate-300 border border-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {supportLoading && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-5 py-6 text-slate-400 font-medium">
                Loading tenant support detail...
              </div>
            )}

            {!supportLoading && !supportDetail && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-5 py-6 text-slate-400 font-medium">
                Select a tenant to inspect recent inquiries, contact messages, and inbox threads.
              </div>
            )}

            {!supportLoading && supportDetail && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black mb-4">
                    Recent Inquiries
                  </p>
                  <div className="space-y-3">
                    {supportDetail.inquiries?.map((item) => (
                      <div key={item._id} className="rounded-2xl bg-white/5 px-4 py-3">
                        <p className="text-sm font-black text-white">{item.name}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">{item.email}</p>
                        <p className="text-xs text-cyan-300 font-black uppercase tracking-widest mt-2">
                          {item.status}
                        </p>
                      </div>
                    ))}
                    {!supportDetail.inquiries?.length && (
                      <p className="text-sm text-slate-500 font-medium">No recent inquiries.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black mb-4">
                    Recent Contact Messages
                  </p>
                  <div className="space-y-3">
                    {supportDetail.contactMessages?.map((item) => (
                      <div key={item._id} className="rounded-2xl bg-white/5 px-4 py-3">
                        <p className="text-sm font-black text-white">{item.name}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">{item.email}</p>
                        <p className="text-xs text-slate-300 font-medium mt-2 line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                    ))}
                    {!supportDetail.contactMessages?.length && (
                      <p className="text-sm text-slate-500 font-medium">No recent contact messages.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black mb-4">
                    Recent Inbox Threads
                  </p>
                  <div className="space-y-3">
                    {supportDetail.threads?.map((item) => (
                      <div key={item._id} className="rounded-2xl bg-white/5 px-4 py-3">
                        <p className="text-sm font-black text-white">
                          {item.subject || "Untitled thread"}
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          {(item.participants || []).join(", ") || "No participants"}
                        </p>
                        <p className="text-xs text-cyan-300 font-black uppercase tracking-widest mt-2">
                          {item.status} • {item.mailboxFolder}
                        </p>
                      </div>
                    ))}
                    {!supportDetail.threads?.length && (
                      <p className="text-sm text-slate-500 font-medium">No recent inbox threads.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">
                Next Platform Step
              </p>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Tenant Actions
                </h2>
            </div>

            <div className="space-y-4 text-sm text-slate-300 font-medium">
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-4 py-4">
                <p className="text-white font-black">Current readiness</p>
                <p className="text-slate-400 mt-2">
                  The super-admin panel can now inspect tenant support workload and recent activity, not just configuration.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-4 py-4">
                <p className="text-white font-black">Strongest next move</p>
                <p className="text-slate-400 mt-2">
                  Add follow-up actions from this panel, like resolving support states, escalating tenant issues, and jumping directly into tenant admin context.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlatformAdminDashboard;
