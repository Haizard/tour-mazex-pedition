/* eslint-disable react/prop-types, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import {
  applyPlatformTenantManagedDns,
  checkPlatformTenantDomainVerification,
  createPlatformTenant,
  fetchPlatformSummary,
  fetchPlatformTenantDomainSetupPlan,
  fetchPlatformTenantPageConfig,
  fetchPlatformTenantMarketing,
  fetchPlatformPageBuilderTemplates,
  fetchPlatformTenantSupport,
  fetchPlatformTenants,
  createPlatformPageBuilderTemplate,
  renewPlatformTenantDomainService,
  updatePlatformTenant,
  updatePlatformTenantAdmin,
} from "../services/api";
import { usePlatformAdminAuth } from "../context/PlatformAdminAuthContext";
import PageBuilderManager from "../components/Admin/PageBuilderManager";
import NavigationManager from "../components/Admin/NavigationManager";
import { getTemplateCatalog } from "../pageBuilder/templateMarketplace";
import { platformPrimarySections } from "./platformAdminNavigation";

const metricCards = [
  ["tenantCount", "Tenants"],
  ["activeTenantCount", "Active"],
  ["tenantAdminCount", "Admins"],
  ["inquiryCount", "Leads"],
  ["openThreadCount", "Threads"],
  ["socialPostCount", "Posts"],
];

const tenantPanels = [
  ["overview", "Overview"],
  ["domains", "Domains"],
  ["credentials", "Credentials"],
  ["subscription", "Subscription"],
  ["site-chrome", "Navbar & Footer"],
  ["page-builder", "Page Builder"],
  ["marketing", "Marketing"],
  ["support", "Support"],
];

const growthSuiteFeatures = [
  ["social-accounts", "Social Channels", "Connect tenant Instagram, Facebook, and other publishing channels."],
  ["social-posts", "Social Posts", "Schedule and publish AI-assisted posts."],
  ["lead-inbox", "Lead Inbox", "Capture and qualify leads from forms, chat, and campaigns."],
  ["repurposing", "Repurposing", "Turn blogs and tours into marketing content."],
  ["review-automation", "Review Automation", "Generate and track post-trip review request workflows."],
  ["campaigns", "Campaigns", "Create seasonal offers and campaign workflows."],
  ["repeat-customer-automation", "Repeat Customer", "Run referral, anniversary, and guest reactivation follow-up."],
  ["unified-inbox", "Unified Inbox", "Work tenant email threads and WhatsApp lead conversations from one team inbox."],
  ["accommodation-coordination", "Accommodation Coordination", "Manage hotel suppliers, reservation tracking, and stay planning for tenant bookings."],
  ["airport-pickup-coordination", "Airport Pickup Coordination", "Schedule airport transfers, assign drivers, and manage arrival dispatch operations."],
  ["payment-automation", "Payment Automation", "Create checkout flows, transaction tracking, and fee-aware collections for booking revenue."],
  ["partner-portal", "Partner Portal", "Manage hotels, agencies, and suppliers through a tenant-specific enterprise partner workspace."],
  ["dynamic-pricing-engine", "Dynamic Pricing Engine", "Run enterprise pricing rules with season, demand, and occupancy multipliers."],
  ["competitor-intelligence", "Competitor Intelligence", "Track competitor pricing, route strategy, and market movement in a tenant-owned intelligence library."],
  ["travel-documentation-assistant", "Travel Documentation Assistant", "Manage visa, vaccine, insurance, and entry-requirement guidance by traveler market."],
  ["multi-language-ai-assistant", "Multi-Language AI Assistant", "Create multilingual guest communication packs and localized AI support setups."],
  ["whatsapp-automation", "WhatsApp Automation", "Enable WhatsApp Business messaging flows."],
  ["guide-driver-management", "Guide & Driver Management", "Manage safari field staff, availability, assignment planning, and booking-linked operations."],
];

const growthPlanFeatureKeys = growthSuiteFeatures
  .filter(([key]) =>
    !["campaigns", "repeat-customer-automation", "unified-inbox", "whatsapp-automation", "guide-driver-management", "accommodation-coordination", "airport-pickup-coordination", "partner-portal", "dynamic-pricing-engine", "multi-language-ai-assistant", "competitor-intelligence"].includes(key)
  )
  .map(([key]) => key);

const proPlanFeatureKeys = growthSuiteFeatures
  .filter(([key]) =>
    !["partner-portal", "dynamic-pricing-engine", "multi-language-ai-assistant", "competitor-intelligence"].includes(key)
  )
  .map(([key]) => key);

const enterprisePlanFeatureKeys = growthSuiteFeatures.map(([key]) => key);

const subscriptionPlans = [
  {
    code: "starter",
    name: "Starter",
    price: "$29",
    description: "Entry plan for smaller operators launching their first managed site.",
    features: ["website-cms", "basic-bookings", "basic-chatbot", "blog-ai", "tour-ai", "payment-automation"],
    limits: ["20 AI generations", "50 chatbot interactions", "1 social account"],
  },
  {
    code: "growth",
    name: "Growth",
    price: "$79",
    description: "Main commercial plan for operators who need leads and social publishing.",
    features: ["website-cms", "basic-bookings", "basic-chatbot", "blog-ai", "tour-ai", ...growthPlanFeatureKeys],
    limits: ["200 AI generations", "500 chatbot interactions", "2 social accounts"],
  },
  {
    code: "pro",
    name: "Pro",
    price: "$199",
    description: "Full growth suite with campaigns, WhatsApp flows, and higher operational limits.",
    features: ["website-cms", "basic-bookings", "basic-chatbot", "blog-ai", "tour-ai", ...proPlanFeatureKeys, "priority-support"],
    limits: ["1000 AI generations", "3000 chatbot interactions", "10 social accounts"],
  },
  {
    code: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "Negotiated packaging for multi-brand or high-touch managed accounts.",
    features: ["website-cms", "basic-bookings", "basic-chatbot", "blog-ai", "tour-ai", ...enterprisePlanFeatureKeys, "priority-support"],
    limits: ["Custom limits", "Custom integrations", "Managed rollout"],
  },
];

const subscriptionTools = [
  ["plans", "Plan Studio", "Pricing, billing cadence, trial and renewal windows"],
  ["growth-suite", "Growth Suite", "Per-tenant access for social, leads, campaigns, and WhatsApp"],
  ["templates", "Templates", "Purchased tourism website templates and page-builder access"],
  ["service", "Hosting Service", "Managed hosting, DNS, and annual renewal controls"],
];

const getSubscriptionPlanMeta = (planCode = "starter") =>
  subscriptionPlans.find((plan) => plan.code === planCode) || subscriptionPlans[0];

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
  demoAccessEnabled: tenant?.demoAccessEnabled !== false,
  domainProviderName: tenant?.domainProvider?.provider || "manual",
  domainAutoManageDns: tenant?.domainProvider?.autoManageDns === true,
  domainZoneId: tenant?.domainProvider?.zoneId || "",
  domainAccountId: tenant?.domainProvider?.accountId || "",
  domainNameserverMode: tenant?.domainProvider?.nameserverMode || "external",
  enableCustomDomains: Boolean(tenant?.features?.enableCustomDomains),
  enablePageBuilder: Boolean(tenant?.features?.enablePageBuilder),
  enableAiContent: tenant?.features?.enableAiContent !== false,
  subscriptionPlan: tenant?.subscription?.plan || "starter",
  subscriptionStatus: tenant?.subscription?.status || "inactive",
  billingInterval: tenant?.subscription?.billingInterval || "monthly",
  trialEndsAt: tenant?.subscription?.trialEndsAt ? new Date(tenant.subscription.trialEndsAt).toISOString().slice(0, 10) : "",
  currentPeriodEndsAt: tenant?.subscription?.currentPeriodEndsAt ? new Date(tenant.subscription.currentPeriodEndsAt).toISOString().slice(0, 10) : "",
  manualOverride: tenant?.subscription?.manualOverride !== false,
  featureOverrides: tenant?.subscription?.featureOverrides || {},
  purchasedTemplates: tenant?.purchasedTemplates || [],
  requestedTemplates: tenant?.requestedTemplates || [],
  ...Object.fromEntries(
    growthSuiteFeatures.map(([key]) => [
      `feature_${key}`,
      tenant?.subscription?.featureOverrides?.[key] === true ||
        getSubscriptionPlanMeta(tenant?.subscription?.plan).features.includes(key),
    ])
  ),
  domainServiceStatus: tenant?.domainService?.serviceStatus || "active",
  annualDomainPriceUsd: String(tenant?.domainService?.annualPriceUsd || 50),
  domainRenewalDueAt: tenant?.domainService?.renewalDueAt ? new Date(tenant.domainService.renewalDueAt).toISOString().slice(0, 10) : "",
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

const createTemplateFormState = () => ({
  name: "",
  category: "Safari Campaign",
  pageType: "landing",
  priceLabel: "$149",
  purchaseStatus: "available",
  status: "published",
  previewImage: "",
  preview: "",
  bestFor: "",
  sectionsJson: JSON.stringify(
    [
      {
        type: "hero",
        variant: "cinematic",
        order: 1,
        enabled: true,
        dataConfig: {},
        contentConfig: {
          eyebrow: "New Travel Campaign",
          headlineScript: "Adventure",
          description: "A platform-created template ready to personalize for a tourism client.",
          primaryCtaLabel: "Start Planning",
          primaryCtaHref: "/contact",
        },
        styleConfig: { spacingPreset: "spacious" },
      },
    ],
    null,
    2
  ),
});

const inputClass = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-950";
const panelClass = "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm";
const labelClass = "mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500";

const domainProviderOptions = [
  { value: "manual", label: "Manual / Any Provider" },
  { value: "cloudflare", label: "Cloudflare" },
  { value: "namecheap", label: "Namecheap" },
  { value: "godaddy", label: "GoDaddy" },
];

const domainProviderHints = {
  manual: "Works with any registrar or DNS provider. Your team or the customer adds the records manually, and the platform verifies them.",
  cloudflare:
    "Good when DNS is already on Cloudflare. Auto-DNS needs Cloudflare API credentials and the correct zone.",
  namecheap:
    "Best when you buy and manage the domain in your own Namecheap account. Auto-DNS needs Namecheap API access plus server IPv4 whitelisting.",
  godaddy:
    "Best when you buy and manage the domain in your own GoDaddy account. Auto-DNS needs production GoDaddy API credentials for that account.",
};

const templateEntitlementCatalog = getTemplateCatalog();

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</p>
    <p className="mt-3 text-3xl font-black text-zinc-950">{value}</p>
  </div>
);

const EmptyState = ({ title, body }) => (
  <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
    <p className="font-black text-zinc-950">{title}</p>
    <p className="mt-2 text-sm font-medium text-zinc-500">{body}</p>
  </div>
);

const PlatformAdminDashboard = () => {
  const { logout, platformAdmin } = usePlatformAdminAuth();
  const [summary, setSummary] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [tenantForm, setTenantForm] = useState(createTenantFormState());
  const [newTenantForm, setNewTenantForm] = useState(createNewTenantState());
  const [templateForm, setTemplateForm] = useState(createTemplateFormState());
  const [adminTemplateCatalog, setAdminTemplateCatalog] = useState(templateEntitlementCatalog);
  const [supportDetail, setSupportDetail] = useState(null);
  const [marketingDetail, setMarketingDetail] = useState(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportMode, setSupportMode] = useState("recent");
  const [activeSection, setActiveSection] = useState("tenants");
  const [activeTenantPanel, setActiveTenantPanel] = useState("overview");
  const [activeSubscriptionTool, setActiveSubscriptionTool] = useState("plans");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [renewingDomain, setRenewingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState("");
  const [applyingDomain, setApplyingDomain] = useState("");
  const [domainPlans, setDomainPlans] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant._id === selectedTenantId) || null,
    [selectedTenantId, tenants]
  );
  const adminTemplateNameLookup = useMemo(
    () => Object.fromEntries(adminTemplateCatalog.map((template) => [template.id, template.name])),
    [adminTemplateCatalog]
  );
  const pendingTemplateRequests = useMemo(
    () =>
      tenants.flatMap((tenant) => {
        const purchasedTemplates = new Set(tenant.purchasedTemplates || []);

        return (tenant.requestedTemplates || [])
          .filter((templateId) => !purchasedTemplates.has(templateId))
          .map((templateId) => ({
            tenantId: tenant._id,
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
            templateId,
            templateName: adminTemplateNameLookup[templateId] || templateId,
          }));
      }),
    [adminTemplateNameLookup, tenants]
  );

  const buildFeatureOverridesPayload = () => {
    const selectedPlan = getSubscriptionPlanMeta(tenantForm.subscriptionPlan);

    return Object.fromEntries(
      growthSuiteFeatures.flatMap(([key]) => {
        const enabled = Boolean(tenantForm[`feature_${key}`]);
        const includedByPlan = selectedPlan.features.includes(key);

        if (enabled === includedByPlan) {
          return [];
        }

        return [[key, enabled]];
      })
    );
  };

  const loadPlatformData = async (preferredTenantId = "") => {
    setLoading(true);
    setError("");
    try {
      const [summaryResponse, tenantsResponse] = await Promise.all([
        fetchPlatformSummary(),
        fetchPlatformTenants(),
      ]);
      const nextSummary = summaryResponse.data?.summary || null;
      const rawTenants = tenantsResponse.data || tenantsResponse.data?.tenants || [];
      const normalizedTenants = Array.isArray(rawTenants) ? rawTenants : rawTenants.tenants || [];
      const nextSelectedTenant =
        normalizedTenants.find((tenant) => tenant._id === preferredTenantId) ||
        normalizedTenants.find((tenant) => tenant._id === selectedTenantId) ||
        normalizedTenants[0] ||
        null;
      setSummary(nextSummary);
      setTenants(normalizedTenants);
      setSelectedTenantId(nextSelectedTenant?._id || "");
      setTenantForm(createTenantFormState(nextSelectedTenant));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load platform data right now.");
    } finally {
      setLoading(false);
    }
  };

  const loadPlatformTemplates = async () => {
    try {
      const response = await fetchPlatformPageBuilderTemplates();
      const builtInTemplates = response.data?.builtInTemplates || getTemplateCatalog();
      const platformTemplates = response.data?.platformTemplates || [];
      const mergedTemplates = new Map();

      builtInTemplates.forEach((template) => mergedTemplates.set(template.id, template));
      platformTemplates.forEach((template) => mergedTemplates.set(template.id, template));
      setAdminTemplateCatalog(Array.from(mergedTemplates.values()));
    } catch (_error) {
      setAdminTemplateCatalog(getTemplateCatalog());
    }
  };

  useEffect(() => {
    loadPlatformData();
    loadPlatformTemplates();
  }, []);

  useEffect(() => {
    setTenantForm(createTenantFormState(selectedTenant));
    if (activeTenantPanel !== "subscription") {
      setActiveSubscriptionTool("plans");
    }
  }, [activeTenantPanel, selectedTenant]);

  useEffect(() => {
    const loadSupportDetail = async () => {
      if (!selectedTenantId || activeSection !== "tenant" || activeTenantPanel !== "support") {
        setSupportDetail(null);
        return;
      }
      setSupportLoading(true);
      try {
        const response = await fetchPlatformTenantSupport(selectedTenantId, { mode: supportMode });
        setSupportDetail(response.data?.support || null);
      } catch (_error) {
        setSupportDetail(null);
      } finally {
        setSupportLoading(false);
      }
    };
    loadSupportDetail();
  }, [activeSection, activeTenantPanel, selectedTenantId, supportMode]);

  useEffect(() => {
    const loadMarketingDetail = async () => {
      if (!selectedTenantId || activeSection !== "tenant" || activeTenantPanel !== "marketing") {
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
  }, [activeSection, activeTenantPanel, selectedTenantId]);

  const openTenant = (tenantId, panel = "overview") => {
    setSelectedTenantId(tenantId);
    setActiveSection("tenant");
    setActiveTenantPanel(panel);
    setNotice("");
    setSupportMode("recent");
  };

  const handleSaveTenant = async (event) => {
    event.preventDefault();
    if (!selectedTenant) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await updatePlatformTenant(selectedTenant._id, {
        name: tenantForm.name,
        subdomain: tenantForm.subdomain,
        status: tenantForm.status,
        customDomains: tenantForm.customDomains.split("\n").map((domain) => domain.trim()).filter(Boolean),
        requestedCustomDomains: tenantForm.requestedCustomDomains.split("\n").map((domain) => domain.trim()).filter(Boolean),
        demoAccessEnabled: tenantForm.demoAccessEnabled,
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
          featureOverrides: buildFeatureOverridesPayload(),
        },
        domainService: {
          ...(selectedTenant.domainService || {}),
          serviceStatus: tenantForm.domainServiceStatus,
          annualPriceUsd: Number(tenantForm.annualDomainPriceUsd || 50),
          renewalDueAt: tenantForm.domainRenewalDueAt || null,
          includesHosting: tenantForm.includesHosting,
          includesManagedDns: tenantForm.includesManagedDns,
        },
        domainProvider: {
          provider: tenantForm.domainProviderName,
          autoManageDns: tenantForm.domainAutoManageDns,
          zoneId: tenantForm.domainZoneId,
          accountId: tenantForm.domainAccountId,
          nameserverMode: tenantForm.domainNameserverMode,
        },
        purchasedTemplates: tenantForm.purchasedTemplates || [],
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
      setError(requestError.response?.data?.message || "Unable to save tenant settings.");
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
      setNotice(`Tenant created with demo domain ${createdTenant?.demoDomain || "pending"} and admin username ${credentials?.adminUsername}.`);
      setNewTenantForm(createNewTenantState());
      await loadPlatformData(createdTenant?._id || "");
      if (createdTenant?._id) openTenant(createdTenant._id, "overview");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create the tenant right now.");
    } finally {
      setCreatingTenant(false);
    }
  };

  const handleCreateTemplate = async (event) => {
    event.preventDefault();
    setCreatingTemplate(true);
    setError("");
    setNotice("");
    try {
      const response = await createPlatformPageBuilderTemplate(templateForm);
      setNotice(response.data?.message || "Template saved to the platform marketplace.");
      setTemplateForm(createTemplateFormState());
      await loadPlatformTemplates();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create this template.");
    } finally {
      setCreatingTemplate(false);
    }
  };

  const fillTemplateFromSelectedTenantHome = async () => {
    if (!selectedTenant) {
      setError("Select a tenant before capturing page-builder sections.");
      return;
    }

    setError("");
    setNotice("");
    try {
      const response = await fetchPlatformTenantPageConfig(selectedTenant._id, "home");
      const page = response.data || {};
      const sections = Array.isArray(page.sections) ? page.sections : [];

      if (!sections.length) {
        setError("The selected tenant homepage does not have page-builder sections yet.");
        return;
      }

      setTemplateForm((current) => ({
        ...current,
        name: current.name || `${selectedTenant.name} Homepage Template`,
        category: current.category || "Tour Operator Homepage",
        pageType: page.pageType || "home",
        preview: current.preview || `A homepage template captured from ${selectedTenant.name}.`,
        sectionsJson: JSON.stringify(sections, null, 2),
      }));
      setNotice("Selected tenant homepage sections copied into Template Studio.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load the tenant homepage sections.");
    }
  };

  const handleRenewDomainService = async () => {
    if (!selectedTenant) return;
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
      setError(requestError.response?.data?.message || "Unable to renew the domain service.");
    } finally {
      setRenewingDomain(false);
    }
  };

  const handleMarkVerified = async (domain) => {
    if (!selectedTenant || !domain) return;
    setVerifyingDomain(domain);
    setError("");
    setNotice("");
    try {
      const response = await checkPlatformTenantDomainVerification(selectedTenant._id, domain);
      const verification = response.data?.verification;
      setNotice(
        verification?.verified
          ? `${domain} is now verified and routed to the platform.`
          : verification?.errorMessage || `${domain} still needs DNS changes before it can verify.`,
      );
      await loadPlatformData(selectedTenant._id);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to check the domain right now.");
    } finally {
      setVerifyingDomain("");
    }
  };

  const handleApplyManagedDns = async (domain) => {
    if (!selectedTenant || !domain) return;
    setApplyingDomain(domain);
    setError("");
    setNotice("");
    try {
      const response = await applyPlatformTenantManagedDns(selectedTenant._id, domain);
      const automation = response.data?.automation;
      setNotice(
        automation?.provider
          ? `${automation.provider} accepted ${automation.recordsApplied} managed DNS record${automation.recordsApplied === 1 ? "" : "s"} for ${domain}.`
          : `DNS automation request was submitted for ${domain}.`,
      );
      await loadPlatformData(selectedTenant._id);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to apply provider DNS automation right now.");
    } finally {
      setApplyingDomain("");
    }
  };

  useEffect(() => {
    const loadDomainPlans = async () => {
      if (!selectedTenant?.customDomainRecords?.length) {
        setDomainPlans({});
        return;
      }

      const entries = await Promise.all(
        selectedTenant.customDomainRecords.map(async (record) => {
          try {
            const response = await fetchPlatformTenantDomainSetupPlan(selectedTenant._id, record.domain);
            return [record.domain, response.data];
          } catch (_error) {
            return [record.domain, null];
          }
        })
      );

      setDomainPlans(Object.fromEntries(entries));
    };

    loadDomainPlans();
  }, [selectedTenant?._id, selectedTenant?.customDomainRecords]);

  const renderTenantList = () => (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {tenants.map((tenant) => (
        <button
          key={tenant._id}
          type="button"
          onClick={() => openTenant(tenant._id)}
          className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-950 hover:shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-black text-zinc-950">{tenant.name}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-500">{tenant.slug}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">{tenant.status || "active"}</span>
          </div>
          <div className="mt-5 space-y-2 text-sm font-semibold text-zinc-600">
            <p>{tenant.demoDomain || "No demo domain"}</p>
            <p>{tenant.subscription?.plan || "starter"} / {tenant.subscription?.status || "inactive"}</p>
            <p>${tenant.domainService?.annualPriceUsd ?? 50} yearly domain service</p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-zinc-50 px-2 py-3"><p className="text-lg font-black">{tenant.pageConfigCount ?? tenant.metrics?.pageConfigs ?? 0}</p><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pages</p></div>
            <div className="rounded-xl bg-zinc-50 px-2 py-3"><p className="text-lg font-black">{tenant.inquiryCount ?? tenant.metrics?.inquiries ?? 0}</p><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Leads</p></div>
            <div className="rounded-xl bg-zinc-50 px-2 py-3"><p className="text-lg font-black">{tenant.socialPostCount ?? tenant.metrics?.socialPosts ?? 0}</p><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Posts</p></div>
          </div>
        </button>
      ))}
      {!loading && tenants.length === 0 && (
        <div className="xl:col-span-3">
          <EmptyState title="No tenants yet" body="Create the first tenant to start managing domains, subscriptions, and website design." />
        </div>
      )}
    </div>
  );

  const renderTemplateRequestQueue = () => {
    if (!pendingTemplateRequests.length) {
      return null;
    }

    return (
      <section className={panelClass}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Template Requests</p>
            <h2 className="mt-2 text-2xl font-black text-zinc-950">Client template opt-ins</h2>
          </div>
          <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-800">
            {pendingTemplateRequests.length} Pending
          </span>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {pendingTemplateRequests.map((request) => (
            <button
              key={`${request.tenantId}-${request.templateId}`}
              type="button"
              onClick={() => {
                setActiveSubscriptionTool("templates");
                openTenant(request.tenantId, "subscription");
              }}
              className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-left transition hover:border-zinc-950 hover:bg-white"
            >
              <p className="text-sm font-black text-zinc-950">{request.templateName}</p>
              <p className="mt-1 text-xs font-semibold text-zinc-600">{request.tenantName}</p>
              <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-amber-800">
                Open template grants
              </p>
            </button>
          ))}
        </div>
      </section>
    );
  };

  const renderCreateTenant = () => (
    <form onSubmit={handleCreateTenant} className={panelClass}>
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Tenant Provisioning</p>
        <h2 className="mt-2 text-2xl font-black text-zinc-950">Create New Tenant</h2>
        <p className="mt-2 text-sm font-medium text-zinc-500">Create a clean tenant with an empty website, demo URL, login credentials, and annual domain pricing.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <input className={inputClass} value={newTenantForm.name} onChange={(event) => setNewTenantForm((current) => ({ ...current, name: event.target.value }))} placeholder="Tenant business name" />
        <input className={inputClass} value={newTenantForm.subdomain} onChange={(event) => setNewTenantForm((current) => ({ ...current, subdomain: event.target.value.toLowerCase() }))} placeholder="Demo subdomain" />
        <input className={inputClass} value={newTenantForm.adminUsername} onChange={(event) => setNewTenantForm((current) => ({ ...current, adminUsername: event.target.value.toLowerCase() }))} placeholder="Admin username" />
        <input className={inputClass} value={newTenantForm.adminPassword} onChange={(event) => setNewTenantForm((current) => ({ ...current, adminPassword: event.target.value }))} placeholder="Admin password" />
        <select className={inputClass} value={newTenantForm.subscriptionPlan} onChange={(event) => setNewTenantForm((current) => ({ ...current, subscriptionPlan: event.target.value }))}>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select className={inputClass} value={newTenantForm.subscriptionStatus} onChange={(event) => setNewTenantForm((current) => ({ ...current, subscriptionStatus: event.target.value }))}>
          <option value="trialing">Trialing</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input className={inputClass} type="number" min="50" max="200" value={newTenantForm.annualDomainPriceUsd} onChange={(event) => setNewTenantForm((current) => ({ ...current, annualDomainPriceUsd: event.target.value }))} placeholder="Annual domain USD" />
      </div>
      <button type="submit" disabled={creatingTenant} className="mt-6 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50">
        {creatingTenant ? "Creating..." : "Create Tenant"}
      </button>
    </form>
  );

  const renderTemplateStudio = () => (
    <div className="space-y-6">
      <div className={panelClass}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Platform Template Studio</p>
            <h2 className="mt-2 text-2xl font-black text-zinc-950">Create templates before tenant onboarding</h2>
          </div>
          <p className="max-w-2xl text-sm font-medium leading-6 text-zinc-500">
            Build reusable marketplace templates at the platform level. Published templates appear on the public template showcase and can be granted to tenants later.
          </p>
        </div>

        <form onSubmit={handleCreateTemplate} className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-zinc-950">New marketplace template</p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                Start from the default sections JSON, paste your own page-builder sections, or optionally capture the selected tenant homepage.
              </p>
            </div>
            {selectedTenant && (
              <button
                type="button"
                onClick={fillTemplateFromSelectedTenantHome}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-zinc-700"
              >
                Capture Tenant Home
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><label className={labelClass}>Template Name</label><input className={inputClass} value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} placeholder="Luxury Migration Campaign" required /></div>
            <div><label className={labelClass}>Category</label><input className={inputClass} value={templateForm.category} onChange={(event) => setTemplateForm((current) => ({ ...current, category: event.target.value }))} placeholder="Safari Campaign" /></div>
            <div><label className={labelClass}>Page Type</label><select className={inputClass} value={templateForm.pageType} onChange={(event) => setTemplateForm((current) => ({ ...current, pageType: event.target.value }))}><option value="home">Home</option><option value="landing">Landing</option><option value="tailor-made">Tailor Made</option><option value="contact">Contact</option></select></div>
            <div><label className={labelClass}>Price Label</label><input className={inputClass} value={templateForm.priceLabel} onChange={(event) => setTemplateForm((current) => ({ ...current, priceLabel: event.target.value }))} placeholder="$149" /></div>
            <div><label className={labelClass}>Purchase Status</label><select className={inputClass} value={templateForm.purchaseStatus} onChange={(event) => setTemplateForm((current) => ({ ...current, purchaseStatus: event.target.value }))}><option value="available">Available / Paid</option><option value="included">Included For All</option></select></div>
            <div><label className={labelClass}>Publish State</label><select className={inputClass} value={templateForm.status} onChange={(event) => setTemplateForm((current) => ({ ...current, status: event.target.value }))}><option value="published">Published</option><option value="draft">Draft</option></select></div>
            <div className="md:col-span-2"><label className={labelClass}>Preview Image URL</label><input className={inputClass} value={templateForm.previewImage} onChange={(event) => setTemplateForm((current) => ({ ...current, previewImage: event.target.value }))} placeholder="https://..." /></div>
            <div className="md:col-span-2"><label className={labelClass}>Preview Copy</label><textarea className={inputClass} rows={3} value={templateForm.preview} onChange={(event) => setTemplateForm((current) => ({ ...current, preview: event.target.value }))} placeholder="Short marketplace description" /></div>
            <div className="md:col-span-2"><label className={labelClass}>Best For</label><textarea className={inputClass} rows={3} value={templateForm.bestFor} onChange={(event) => setTemplateForm((current) => ({ ...current, bestFor: event.target.value }))} placeholder={"Luxury safari brands\nSeasonal campaigns"} /></div>
            <div className="md:col-span-2 xl:col-span-4"><label className={labelClass}>Page Builder Sections JSON</label><textarea className={`${inputClass} font-mono text-xs`} rows={10} value={templateForm.sectionsJson} onChange={(event) => setTemplateForm((current) => ({ ...current, sectionsJson: event.target.value }))} required /></div>
          </div>

          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={creatingTemplate} className="rounded-xl bg-zinc-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
              {creatingTemplate ? "Saving Template..." : "Create Template"}
            </button>
          </div>
        </form>
      </div>

      <div className={panelClass}>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Template Catalog</p>
        <h3 className="mt-2 text-xl font-black text-zinc-950">Built-in and platform-created templates</h3>
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {adminTemplateCatalog.map((template) => (
            <article key={template.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{template.category}</p>
                  <h4 className="mt-2 text-base font-black text-zinc-950">{template.name}</h4>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  {template.status || "published"}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-zinc-500">{template.preview}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-zinc-950 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">{template.priceLabel}</span>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-600">{template.pageType}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTenantOverview = () => {
    if (!selectedTenant) return <EmptyState title="No tenant selected" body="Choose a tenant from the overview to open the tenant workspace." />;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Plan" value={selectedTenant.subscription?.plan || "starter"} />
          <StatCard label="Status" value={selectedTenant.subscription?.status || "inactive"} />
          <StatCard label="Domain Price" value={`$${selectedTenant.domainService?.annualPriceUsd ?? 50}`} />
          <StatCard label="Renewal" value={selectedTenant.domainService?.renewalDueAt ? new Date(selectedTenant.domainService.renewalDueAt).toLocaleDateString() : "Not set"} />
        </div>
        <div className={panelClass}>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Tenant Snapshot</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-zinc-50 p-4"><p className="text-sm font-black">Demo URL</p><p className="mt-1 break-all text-sm font-medium text-zinc-500">{selectedTenant.demoDomain || "Pending"}</p><p className="mt-2 text-[11px] font-black uppercase tracking-widest text-zinc-400">{selectedTenant.demoAccessEnabled === false ? "Demo disabled" : "Demo active"}</p></div>
            <div className="rounded-xl bg-zinc-50 p-4"><p className="text-sm font-black">Login</p><p className="mt-1 text-sm font-medium text-zinc-500">{selectedTenant.admins?.[0]?.username || "Not set"}</p></div>
            <div className="rounded-xl bg-zinc-50 p-4"><p className="text-sm font-black">Custom Domains</p><p className="mt-1 text-sm font-medium text-zinc-500">{selectedTenant.customDomains?.join(", ") || "None yet"}</p></div>
            <div className="rounded-xl bg-zinc-50 p-4"><p className="text-sm font-black">Workload</p><p className="mt-1 text-sm font-medium text-zinc-500">{selectedTenant.openThreadCount ?? selectedTenant.metrics?.openThreads ?? 0} open threads, {selectedTenant.inquiryCount ?? selectedTenant.metrics?.inquiries ?? 0} inquiries</p></div>
          </div>
        </div>
      </div>
    );
  };

  const renderDomains = () => (
    <form onSubmit={handleSaveTenant} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className={panelClass}>
        <p className="text-xl font-black text-zinc-950">Domain Settings</p>
        <div className="mt-5 space-y-4">
          <div><label className={labelClass}>Tenant Name</label><input className={inputClass} value={tenantForm.name} onChange={(event) => setTenantForm((current) => ({ ...current, name: event.target.value }))} /></div>
          <div><label className={labelClass}>Demo Subdomain</label><input className={inputClass} value={tenantForm.subdomain} onChange={(event) => setTenantForm((current) => ({ ...current, subdomain: event.target.value.toLowerCase() }))} /></div>
          <div><label className={labelClass}>Custom Domains</label><textarea rows={5} className={inputClass} value={tenantForm.customDomains} onChange={(event) => setTenantForm((current) => ({ ...current, customDomains: event.target.value }))} placeholder="One custom domain per line" /></div>
          <div><label className={labelClass}>Requested Domains</label><textarea rows={3} className={inputClass} value={tenantForm.requestedCustomDomains} onChange={(event) => setTenantForm((current) => ({ ...current, requestedCustomDomains: event.target.value }))} /></div>
          <div>
            <label className={labelClass}>DNS Provider</label>
            <select className={inputClass} value={tenantForm.domainProviderName} onChange={(event) => setTenantForm((current) => ({ ...current, domainProviderName: event.target.value }))}>
              {domainProviderOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="mt-2 text-xs font-semibold text-zinc-500">
              {domainProviderHints[tenantForm.domainProviderName] || domainProviderHints.manual}
            </p>
          </div>
          <div><label className={labelClass}>Nameserver Mode</label><select className={inputClass} value={tenantForm.domainNameserverMode} onChange={(event) => setTenantForm((current) => ({ ...current, domainNameserverMode: event.target.value }))}><option value="external">Customer keeps DNS elsewhere</option><option value="delegated">Customer delegates DNS to platform</option></select></div>
          <div><label className={labelClass}>Zone ID</label><input className={inputClass} value={tenantForm.domainZoneId} onChange={(event) => setTenantForm((current) => ({ ...current, domainZoneId: event.target.value }))} placeholder="Optional now, required for provider automation" /></div>
          <div><label className={labelClass}>Provider Account ID</label><input className={inputClass} value={tenantForm.domainAccountId} onChange={(event) => setTenantForm((current) => ({ ...current, domainAccountId: event.target.value }))} placeholder="Optional provider account reference" /></div>
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-bold text-zinc-700">
            Platform auto-manages DNS when provider integration is available
            <input type="checkbox" checked={tenantForm.domainAutoManageDns} onChange={(event) => setTenantForm((current) => ({ ...current, domainAutoManageDns: event.target.checked }))} className="h-4 w-4 accent-zinc-950" />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-bold text-zinc-700">
            Demo link stays active after launch
            <input type="checkbox" checked={tenantForm.demoAccessEnabled} onChange={(event) => setTenantForm((current) => ({ ...current, demoAccessEnabled: event.target.checked }))} className="h-4 w-4 accent-zinc-950" />
          </label>
          <button className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50" disabled={saving}>{saving ? "Saving..." : "Save Domain Settings"}</button>
        </div>
      </div>
      <div className={panelClass}>
        <p className="text-xl font-black text-zinc-950">Verification Records</p>
        <div className="mt-5 space-y-4">
          {(selectedTenant?.customDomainRecords || []).map((record) => (
            <div key={record.domain} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div><p className="font-black">{record.domain}</p><p className="mt-2 text-xs font-semibold text-zinc-500">TXT host: {record.verificationHost}</p><p className="mt-1 break-all text-xs font-semibold text-zinc-500">Value: {record.verificationValue}</p><p className="mt-1 text-xs font-semibold text-zinc-500">Route target: {record.expectedTarget}</p>{record.lastCheckedAt ? <p className="mt-1 text-xs font-semibold text-zinc-400">Last checked: {new Date(record.lastCheckedAt).toLocaleString()}</p> : null}{record.errorMessage ? <p className="mt-2 text-xs font-semibold text-red-600">{record.errorMessage}</p> : null}</div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${record.status === "verified" ? "bg-emerald-50 text-emerald-700" : record.status === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{record.status}</span>
              </div>
              <button type="button" disabled={verifyingDomain === record.domain} onClick={() => handleMarkVerified(record.domain)} className="mt-4 rounded-xl border border-zinc-300 px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-40">
                {verifyingDomain === record.domain ? "Checking DNS..." : record.status === "verified" ? "Re-check DNS" : "Check DNS Now"}
              </button>
              {["namecheap", "godaddy"].includes(domainPlans[record.domain]?.capabilities?.provider) && tenantForm.domainAutoManageDns ? (
                <button
                  type="button"
                  disabled={applyingDomain === record.domain}
                  onClick={() => handleApplyManagedDns(record.domain)}
                  className="mt-3 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-40"
                >
                  {applyingDomain === record.domain ? "Applying DNS..." : "Apply Provider DNS"}
                </button>
              ) : null}
              {domainPlans[record.domain]?.setupPlan ? (
                <div className="mt-4 rounded-xl bg-white p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Setup Plan</p>
                  <p className="mt-2 text-xs font-semibold text-zinc-600">{domainPlans[record.domain].setupPlan.instructions}</p>
                  <div className="mt-3 space-y-2">
                    {domainPlans[record.domain].setupPlan.records.map((item, index) => (
                      <div key={`${record.domain}-${index}`} className="rounded-lg border border-zinc-200 px-3 py-3 text-xs font-semibold text-zinc-600">
                        <p><span className="font-black text-zinc-900">Type:</span> {item.type}</p>
                        <p className="break-all"><span className="font-black text-zinc-900">Host:</span> {item.host}</p>
                        <p className="break-all"><span className="font-black text-zinc-900">Value:</span> {item.value}</p>
                        <p><span className="font-black text-zinc-900">Purpose:</span> {item.purpose}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-zinc-400">
                    Provider: {domainPlans[record.domain].capabilities?.provider || "manual"} / {domainPlans[record.domain].capabilities?.supportsAutomaticDnsWrites ? "auto-DNS capable" : "manual DNS only"}
                  </p>
                  {domainPlans[record.domain].capabilities?.requiresWhitelistedServerIp ? (
                    <p className="mt-2 text-xs font-semibold text-zinc-500">Needs Namecheap API access and your server IPv4 whitelisted before auto-DNS can succeed.</p>
                  ) : null}
                  {domainPlans[record.domain].capabilities?.requiresApiSecret ? (
                    <p className="mt-2 text-xs font-semibold text-zinc-500">Needs GoDaddy production API key and secret from the account that owns this domain.</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          {!selectedTenant?.customDomainRecords?.length && <EmptyState title="No verification records" body="Save custom domains to generate DNS verification records." />}
        </div>
      </div>
    </form>
  );

  const renderCredentials = () => (
    <form onSubmit={handleSaveTenant} className={panelClass}>
      <p className="text-xl font-black text-zinc-950">Tenant Login Credentials</p>
      <p className="mt-2 text-sm font-medium text-zinc-500">Control the tenant admin username, display name, status, and password reset.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <input className={inputClass} value={tenantForm.adminUsername} onChange={(event) => setTenantForm((current) => ({ ...current, adminUsername: event.target.value.toLowerCase() }))} placeholder="Username" />
        <input className={inputClass} value={tenantForm.adminPassword} onChange={(event) => setTenantForm((current) => ({ ...current, adminPassword: event.target.value }))} placeholder="New password, blank keeps old" />
        <input className={inputClass} value={tenantForm.adminDisplayName} onChange={(event) => setTenantForm((current) => ({ ...current, adminDisplayName: event.target.value }))} placeholder="Display name" />
        <select className={inputClass} value={tenantForm.adminStatus} onChange={(event) => setTenantForm((current) => ({ ...current, adminStatus: event.target.value }))}>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
      <button className="mt-6 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50" disabled={saving}>{saving ? "Saving..." : "Save Credentials"}</button>
    </form>
  );

  const renderSubscription = () => {
    const selectedPlan = getSubscriptionPlanMeta(tenantForm.subscriptionPlan);
    const activeFeatureCount = growthSuiteFeatures.filter(([key]) => Boolean(tenantForm[`feature_${key}`])).length;

    return (
      <form onSubmit={handleSaveTenant} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Plan" value={selectedPlan.name} />
          <StatCard label="Status" value={tenantForm.subscriptionStatus || "inactive"} />
          <StatCard label="Growth Suite" value={`${activeFeatureCount}/${growthSuiteFeatures.length}`} />
          <StatCard label="Annual Service" value={`$${tenantForm.annualDomainPriceUsd || 50}`} />
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm md:grid-cols-3">
          {subscriptionTools.map(([id, label, description]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSubscriptionTool(id)}
              className={`rounded-2xl px-5 py-4 text-left transition ${
                activeSubscriptionTool === id
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              <span className="block text-sm font-black">{label}</span>
              <span className={`mt-1 block text-xs font-semibold ${activeSubscriptionTool === id ? "text-zinc-300" : "text-zinc-500"}`}>{description}</span>
            </button>
          ))}
        </div>

        {activeSubscriptionTool === "plans" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
              {subscriptionPlans.map((plan) => {
                const isActive = tenantForm.subscriptionPlan === plan.code;
                return (
                  <button
                    key={plan.code}
                    type="button"
                    onClick={() => setTenantForm((current) => ({ ...current, subscriptionPlan: plan.code }))}
                    className={`rounded-3xl border p-5 text-left transition ${
                      isActive
                        ? "border-zinc-950 bg-zinc-950 text-white shadow-xl"
                        : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isActive ? "text-zinc-400" : "text-zinc-500"}`}>{plan.code}</p>
                        <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isActive ? "bg-white text-zinc-950" : "bg-zinc-100 text-zinc-700"}`}>
                        {plan.price}
                      </span>
                    </div>
                    <p className={`mt-4 text-sm font-medium leading-6 ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>{plan.description}</p>
                    <div className="mt-5 space-y-2">
                      {plan.limits.map((limit) => (
                        <p key={`${plan.code}-${limit}`} className={`text-xs font-black uppercase tracking-widest ${isActive ? "text-zinc-400" : "text-zinc-500"}`}>{limit}</p>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={panelClass}>
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Billing Controls</p>
                  <h2 className="mt-2 text-2xl font-black text-zinc-950">Subscription state and commercial timing</h2>
                </div>
                <p className="max-w-xl text-sm font-medium text-zinc-500">
                  Use this panel to control what commercial state the tenant is in, without opening code or changing plan definitions.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div><label className={labelClass}>Subscription Status</label><select className={inputClass} value={tenantForm.subscriptionStatus} onChange={(event) => setTenantForm((current) => ({ ...current, subscriptionStatus: event.target.value }))}><option value="inactive">Inactive</option><option value="trialing">Trialing</option><option value="active">Active</option><option value="past_due">Past Due</option><option value="cancelled">Cancelled</option></select></div>
                <div><label className={labelClass}>Billing Interval</label><select className={inputClass} value={tenantForm.billingInterval} onChange={(event) => setTenantForm((current) => ({ ...current, billingInterval: event.target.value }))}><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="custom">Custom</option></select></div>
                <div><label className={labelClass}>Trial Ends</label><input className={inputClass} type="date" value={tenantForm.trialEndsAt} onChange={(event) => setTenantForm((current) => ({ ...current, trialEndsAt: event.target.value }))} /></div>
                <div><label className={labelClass}>Current Period Ends</label><input className={inputClass} type="date" value={tenantForm.currentPeriodEndsAt} onChange={(event) => setTenantForm((current) => ({ ...current, currentPeriodEndsAt: event.target.value }))} /></div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[["manualOverride", "Manual override"], ["enableCustomDomains", "Custom domains"], ["enablePageBuilder", "Page builder"], ["enableAiContent", "AI content"]].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-bold text-zinc-700">
                    {label}
                    <input type="checkbox" checked={tenantForm[key]} onChange={(event) => setTenantForm((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-zinc-950" />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubscriptionTool === "growth-suite" && (
          <div className={panelClass}>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Growth Suite Access</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950">Per-tenant commercial entitlements</h2>
              </div>
              <p className="max-w-xl text-sm font-medium text-zinc-500">
                Override the default plan package when you need a custom commercial deal for one tenant without changing the whole pricing catalog.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-black text-zinc-950">Base plan entitlement</p>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                {selectedPlan.name} includes {selectedPlan.features.filter((feature) => growthSuiteFeatures.some(([key]) => key === feature)).length} packaged Growth Suite features before overrides.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {growthSuiteFeatures.map(([key, label, description]) => {
                const includedByPlan = selectedPlan.features.includes(key);
                const enabled = Boolean(tenantForm[`feature_${key}`]);

                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start justify-between gap-5 rounded-2xl border p-5 transition ${
                      enabled
                        ? "border-emerald-300 bg-emerald-50/60 shadow-sm"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-black text-zinc-950">{label}</span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-zinc-500">{description}</span>
                      <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${includedByPlan ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-700"}`}>
                        {includedByPlan ? "Included In Plan" : "Override Only"}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(event) =>
                        setTenantForm((current) => ({
                          ...current,
                          [`feature_${key}`]: event.target.checked,
                        }))
                      }
                      className="mt-1 h-5 w-5 accent-emerald-600"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {activeSubscriptionTool === "templates" && (
          <div className={panelClass}>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Template Entitlements</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950">Grant purchased website templates</h2>
              </div>
              <p className="max-w-xl text-sm font-medium text-zinc-500">
                Control which platform-owned templates this tenant can use inside Page Studio and on the public template marketplace.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
              {adminTemplateCatalog.map((template) => {
                const included = template.purchaseStatus === "included";
                const checked = included || tenantForm.purchasedTemplates.includes(template.id);
                const requested = tenantForm.requestedTemplates.includes(template.id);

                return (
                  <label
                    key={template.id}
                    className={`flex cursor-pointer flex-col rounded-2xl border p-5 transition ${
                      checked ? "border-emerald-300 bg-emerald-50/60" : "border-zinc-200 bg-white"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-4">
                      <span>
                        <span className="block text-sm font-black text-zinc-950">{template.name}</span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-zinc-500">{template.preview}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={included}
                        onChange={(event) =>
                          setTenantForm((current) => {
                            const currentTemplates = new Set(current.purchasedTemplates || []);
                            if (event.target.checked) {
                              currentTemplates.add(template.id);
                            } else {
                              currentTemplates.delete(template.id);
                            }

                            return {
                              ...current,
                              purchasedTemplates: [...currentTemplates],
                            };
                          })
                        }
                        className="mt-1 h-5 w-5 accent-emerald-600 disabled:opacity-50"
                      />
                    </span>
                    <span className={`mt-4 w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${included ? "bg-zinc-950 text-white" : checked ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-700"}`}>
                      {included ? "Included" : checked ? "Purchased" : requested ? "Client Requested" : template.priceLabel}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {activeSubscriptionTool === "service" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.8fr]">
            <div className={panelClass}>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Hosting Service</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950">Managed hosting, DNS, and renewal controls</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div><label className={labelClass}>Annual Service Price (USD)</label><input className={inputClass} type="number" min="50" max="200" value={tenantForm.annualDomainPriceUsd} onChange={(event) => setTenantForm((current) => ({ ...current, annualDomainPriceUsd: event.target.value }))} /></div>
                <div><label className={labelClass}>Service Status</label><select className={inputClass} value={tenantForm.domainServiceStatus} onChange={(event) => setTenantForm((current) => ({ ...current, domainServiceStatus: event.target.value }))}><option value="active">Active</option><option value="pending_renewal">Pending Renewal</option><option value="expired">Expired</option></select></div>
                <div><label className={labelClass}>Renewal Due Date</label><input className={inputClass} type="date" value={tenantForm.domainRenewalDueAt} onChange={(event) => setTenantForm((current) => ({ ...current, domainRenewalDueAt: event.target.value }))} /></div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                {[["includesHosting", "Hosting included"], ["includesManagedDns", "Managed DNS"]].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-bold text-zinc-700">
                    {label}
                    <input type="checkbox" checked={tenantForm[key]} onChange={(event) => setTenantForm((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-zinc-950" />
                  </label>
                ))}
              </div>
            </div>

            <div className={panelClass}>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Renewal Action</p>
              <h3 className="mt-2 text-xl font-black text-zinc-950">Annual domain recharge</h3>
              <p className="mt-3 text-sm font-medium text-zinc-500">Charge between $50 and $200 yearly for domain, DNS, hosting, and managed service.</p>
              <button type="button" disabled={renewingDomain} onClick={handleRenewDomainService} className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50">
                {renewingDomain ? "Renewing..." : "Renew For 1 Year"}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button className="rounded-xl bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50" disabled={saving}>
            {saving ? "Saving..." : "Save Subscription Workspace"}
          </button>
        </div>
      </form>
    );
  };

  const renderMarketing = () => (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
      {[["Accounts", marketingDetail?.socialAccounts || [], (item) => `${item.provider} / ${item.status}`], ["Social Posts", marketingDetail?.socialPosts || [], (item) => item.status], ["Campaigns", marketingDetail?.campaigns || [], (item) => `${item.campaignType} / ${item.status}`], ["Recent Leads", marketingDetail?.inquiries || [], (item) => `${item.sourceChannel || "lead"} / ${item.status}`]].map(([title, items, subtitle]) => (
        <div key={title} className={panelClass}>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">{title}</p>
          <div className="mt-5 space-y-3">
            {items.map((item) => <div key={item._id} className="rounded-xl bg-zinc-50 p-4"><p className="font-black text-zinc-950">{item.label || item.title || item.name}</p><p className="mt-1 text-xs font-black uppercase tracking-widest text-zinc-500">{subtitle(item)}</p></div>)}
            {!items.length && <p className="text-sm font-medium text-zinc-500">No records yet.</p>}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSupport = () => (
    <div className={panelClass}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Support Detail</p><h2 className="mt-2 text-2xl font-black text-zinc-950">{selectedTenant?.name || "Tenant"} Activity</h2></div>
        <div className="flex gap-2">{[["recent", "Recent"], ["unresolved", "Needs Action"]].map(([mode, label]) => <button key={mode} type="button" onClick={() => setSupportMode(mode)} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest ${supportMode === mode ? "bg-zinc-950 text-white" : "border border-zinc-200 text-zinc-600"}`}>{label}</button>)}</div>
      </div>
      {supportLoading && <p className="mt-6 text-sm font-medium text-zinc-500">Loading tenant support detail...</p>}
      {!supportLoading && supportDetail && (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {[["Inquiries", supportDetail.inquiries || [], (item) => item.email], ["Contact Messages", supportDetail.contactMessages || [], (item) => item.message], ["Inbox Threads", supportDetail.threads || [], (item) => (item.participants || []).join(", ") || "No participants"]].map(([title, items, subtitle]) => (
            <div key={title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">{title}</p>
              <div className="mt-4 space-y-3">
                {items.map((item) => <div key={item._id} className="rounded-xl bg-white p-4"><p className="font-black text-zinc-950">{item.name || item.subject || "Untitled"}</p><p className="mt-1 line-clamp-2 text-xs font-medium text-zinc-500">{subtitle(item)}</p><p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.status}</p></div>)}
                {!items.length && <p className="text-sm font-medium text-zinc-500">No records.</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderActiveTenantPanel = () => {
    if (!selectedTenant) {
      return <EmptyState title="Select a tenant" body="Choose a tenant from the overview before opening tenant settings." />;
    }
    if (activeTenantPanel === "domains") return renderDomains();
    if (activeTenantPanel === "credentials") return renderCredentials();
    if (activeTenantPanel === "subscription") return renderSubscription();
    if (activeTenantPanel === "site-chrome") {
      return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <NavigationManager
            key={selectedTenant._id}
            mode="platform"
            tenantId={selectedTenant._id}
            tenantName={selectedTenant.name}
          />
        </div>
      );
    }
    if (activeTenantPanel === "page-builder") {
      return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <PageBuilderManager
            key={selectedTenant._id}
            mode="layout"
            tenantId={selectedTenant._id}
            tenantName={selectedTenant.name}
            purchasedTemplates={selectedTenant.purchasedTemplates || []}
            requestedTemplates={selectedTenant.requestedTemplates || []}
          />
        </div>
      );
    }
    if (activeTenantPanel === "marketing") return renderMarketing();
    if (activeTenantPanel === "support") return renderSupport();
    return renderTenantOverview();
  };

  const renderPrimaryNavButton = (id, label) => (
    <button
      key={id}
      type="button"
      onClick={() => setActiveSection(id)}
      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-black transition ${
        activeSection === id
          ? "bg-white text-zinc-950"
          : "text-zinc-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  const renderTenantNavButton = (id, label) => (
    <button
      key={id}
      type="button"
      disabled={!selectedTenant}
      onClick={() => {
        setActiveSection("tenant");
        setActiveTenantPanel(id);
      }}
      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-35 ${
        activeSection === "tenant" && activeTenantPanel === id
          ? "bg-white text-zinc-950"
          : "text-zinc-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  const headerMeta = {
    tenants: {
      eyebrow: "Overview",
      title: "Tenant Home",
      description: "Monitor the platform, open tenants quickly, and keep every customer separated in a professional control plane.",
    },
    create: {
      eyebrow: "Provisioning",
      title: "Create Tenant",
      description: "Provision a clean tenant with its own login, empty website content, demo route, and managed hosting billing.",
    },
    "template-studio": {
      eyebrow: "Template Studio",
      title: "Template Studio",
      description: "Create reusable page-builder templates before any tenant is onboarded, then grant them later.",
    },
    tenant: {
      eyebrow: "Tenant Detail",
      title: selectedTenant?.name || "Tenant Workspace",
      description: "Manage this tenant through focused workspaces for domains, credentials, subscriptions, page layout, marketing, and support.",
    },
  }[activeSection] || {
    eyebrow: "Overview",
    title: "Tenant Home",
    description: "Monitor the platform, open tenants quickly, and keep every customer separated in a professional control plane.",
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-zinc-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-zinc-200 bg-[#050505] p-4 text-white lg:flex lg:flex-col">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Platform Console</p>
          <p className="mt-2 text-lg font-black">Mazex Control</p>
          <p className="mt-1 truncate text-xs font-semibold text-zinc-400">{platformAdmin?.displayName || platformAdmin?.username || "Super admin"}</p>
        </div>

        <nav className="mt-5 space-y-2">
          {platformPrimarySections.map(({ id, label }) => renderPrimaryNavButton(id, label))}
        </nav>

        <div className="mt-7 border-t border-white/10 pt-5">
          <p className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-600">Tenant Workspace</p>
          <div className="space-y-2">
            {tenantPanels.map(([id, label]) => renderTenantNavButton(id, label))}
          </div>
        </div>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-zinc-500">Selected tenant</p>
          <p className="mt-1 truncate text-sm font-black text-white">{selectedTenant?.name || "None selected"}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-4 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-black text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-5 py-6 md:px-8 lg:px-10">
          <header className="mb-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 bg-[radial-gradient(circle_at_top_right,_rgba(24,24,27,0.14),_transparent_32%),linear-gradient(135deg,_#fff,_#f4f4f5)] p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    {headerMeta.eyebrow}
                  </p>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 md:text-5xl">
                    {headerMeta.title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-zinc-600 md:text-base">
                    {headerMeta.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection("create")}
                    className="rounded-xl bg-zinc-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-zinc-800"
                  >
                    New Tenant
                  </button>
                  {selectedTenant && (
                    <button
                      type="button"
                      onClick={() => openTenant(selectedTenant._id, "domains")}
                      className="rounded-xl border border-zinc-300 px-5 py-3 text-xs font-black uppercase tracking-widest text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
                    >
                      Domain Settings
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</div>}
          {notice && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{notice}</div>}

          <div className="mb-5 grid grid-cols-2 gap-2 lg:hidden">
            {platformPrimarySections.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`rounded-xl px-4 py-3 text-sm font-black ${activeSection === id ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white text-zinc-700"}`}
              >
                {label}
              </button>
            ))}
            {tenantPanels.map(([id, label]) => (
              <button
                key={id}
                type="button"
                disabled={!selectedTenant}
                onClick={() => {
                  setActiveSection("tenant");
                  setActiveTenantPanel(id);
                }}
                className={`rounded-xl px-4 py-3 text-sm font-black disabled:opacity-40 ${
                  activeSection === "tenant" && activeTenantPanel === id
                    ? "bg-zinc-950 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeSection === "tenants" && (
            <div className="space-y-6">
              <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
                {metricCards.map(([key, label]) => (
                  <StatCard key={key} label={label} value={loading ? "..." : summary?.[key] ?? 0} />
                ))}
              </section>
              {loading ? (
                <div className={panelClass}>
                  <p className="text-sm font-bold text-zinc-500">Loading tenants...</p>
                </div>
              ) : (
                <>
                  {renderTemplateRequestQueue()}
                  {renderTenantList()}
                </>
              )}
            </div>
          )}

          {activeSection === "create" && renderCreateTenant()}
          {activeSection === "template-studio" && renderTemplateStudio()}
          {activeSection === "tenant" && renderActiveTenantPanel()}
        </div>
      </main>
    </div>
  );
};

export default PlatformAdminDashboard;
