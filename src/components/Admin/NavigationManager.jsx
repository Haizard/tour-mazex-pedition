import React from "react";
import { FaBars, FaCog, FaLink } from "react-icons/fa";
import Card from "../UI/Card";
import Button from "../UI/Button";
import Badge from "../UI/Badge";
import {
  createMenuItem,
  createPlatformTenantMenuItem,
  deleteMenuItem,
  deletePlatformTenantMenuItem,
  fetchMenuItems,
  fetchPlatformTenantMenuItems,
  fetchPlatformTenantSiteConfig,
  fetchTenantSiteConfig,
  resetPlatformTenantMenuItemsToDefaults,
  resetMenuItemsToDefaults,
  updateMenuItem,
  updatePlatformTenantMenuItem,
  updatePlatformTenantSiteConfig,
  updateTenantSiteConfig,
} from "../../services/api";
import { useTenant } from "../../context/TenantContext";

const initialMenuForm = {
  label: "",
  link: "",
  itemType: "link",
  categoryKey: "",
  menuTitle: "",
  imageKey: "tembo",
  sortOrder: "",
  childrenText: "",
};

const defaultSiteConfigFormData = {
  navigationConfig: {
    ctaLabel: "PLAN MY TRIP",
    ctaHref: "/plan-my-trip",
    aboutLabel: "About Us",
    aboutHref: "/about",
    logoPlacement: "left",
  },
  footerConfig: {
    brandName: "",
    brandDescription: "",
    primaryCtaLabel: "",
    primaryCtaHref: "",
    secondaryCtaLabel: "",
    secondaryCtaHref: "",
    copyrightLabel: "",
    mobileCopyrightLabel: "",
  },
};

const NavigationManager = ({ mode = "tenant", tenantId = "", tenantName = "" } = {}) => {
  const { refreshTenant } = useTenant();
  const isPlatformMode = mode === "platform" && tenantId;
  const [menuItems, setMenuItems] = React.useState([]);
  const [menuFormData, setMenuFormData] = React.useState(initialMenuForm);
  const [editingMenuId, setEditingMenuId] = React.useState(null);
  const [siteConfigFormData, setSiteConfigFormData] = React.useState(defaultSiteConfigFormData);
  const [loading, setLoading] = React.useState(false);
  const [activeChromeTool, setActiveChromeTool] = React.useState("chrome");

  const loadMenuItems = async () => {
    try {
      const res = isPlatformMode
        ? await fetchPlatformTenantMenuItems(tenantId)
        : await fetchMenuItems();
      setMenuItems(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSiteConfig = async () => {
    try {
      const res = isPlatformMode
        ? await fetchPlatformTenantSiteConfig(tenantId)
        : await fetchTenantSiteConfig();
      setSiteConfigFormData({
        navigationConfig: {
          ctaLabel: res.data?.navigationConfig?.ctaLabel || "",
          ctaHref: res.data?.navigationConfig?.ctaHref || "",
          aboutLabel: res.data?.navigationConfig?.aboutLabel || "",
          aboutHref: res.data?.navigationConfig?.aboutHref || "",
          logoPlacement: res.data?.navigationConfig?.logoPlacement || "left",
        },
        footerConfig: {
          brandName: res.data?.footerConfig?.brandName || "",
          brandDescription: res.data?.footerConfig?.brandDescription || "",
          primaryCtaLabel: res.data?.footerConfig?.primaryCtaLabel || "",
          primaryCtaHref: res.data?.footerConfig?.primaryCtaHref || "",
          secondaryCtaLabel: res.data?.footerConfig?.secondaryCtaLabel || "",
          secondaryCtaHref: res.data?.footerConfig?.secondaryCtaHref || "",
          copyrightLabel: res.data?.footerConfig?.copyrightLabel || "",
          mobileCopyrightLabel: res.data?.footerConfig?.mobileCopyrightLabel || "",
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    loadMenuItems();
    loadSiteConfig();
  }, [isPlatformMode, tenantId]);

  const handleMenuInputChange = (e) =>
    setMenuFormData((current) => ({ ...current, [e.target.name]: e.target.value }));

  const resetMenuForm = () => {
    setMenuFormData(initialMenuForm);
    setEditingMenuId(null);
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const children = (menuFormData.childrenText || "")
        .split("\n")
        .map((line, index) => {
          const [label, link] = line.split("|").map((part) => part?.trim());
          if (!label || !link) return null;
          return { label, link, sortOrder: index + 1 };
        })
        .filter(Boolean);

      const payload = {
        label: menuFormData.label,
        link: menuFormData.link,
        itemType: menuFormData.itemType,
        categoryKey: menuFormData.categoryKey || undefined,
        menuTitle: menuFormData.menuTitle || undefined,
        imageKey:
          menuFormData.itemType === "megamenu" ? menuFormData.imageKey : undefined,
        sortOrder: Number(menuFormData.sortOrder || 0),
        children,
      };

      if (editingMenuId) {
        if (isPlatformMode) {
          await updatePlatformTenantMenuItem(tenantId, editingMenuId, payload);
        } else {
          await updateMenuItem(editingMenuId, payload);
        }
      } else {
        if (isPlatformMode) {
          await createPlatformTenantMenuItem(tenantId, payload);
        } else {
          await createMenuItem(payload);
        }
      }

      resetMenuForm();
      await loadMenuItems();
    } catch (error) {
      console.error(error);
      alert("Failed to save menu item.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationConfigSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isPlatformMode) {
        await updatePlatformTenantSiteConfig(tenantId, siteConfigFormData);
      } else {
        await updateTenantSiteConfig(siteConfigFormData);
        await refreshTenant?.();
      }
      await loadSiteConfig();
      alert("Navigation and footer config updated.");
    } catch (error) {
      console.error(error);
      alert("Failed to update navigation config.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            {isPlatformMode ? "Super Admin Website Chrome" : "Navigation"}
          </p>
          <h2 className="mt-2 text-3xl font-black text-gray-900 uppercase tracking-tighter">
            {isPlatformMode ? `${tenantName || "Tenant"} Navbar & Footer` : "Navigation"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{menuItems.length} Menu Items</Badge>
          <Button
            variant="outline"
            onClick={() =>
              (isPlatformMode
                ? resetPlatformTenantMenuItemsToDefaults(tenantId)
                : resetMenuItemsToDefaults()
              ).then(loadMenuItems)
            }
          >
            Restore Defaults
          </Button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 rounded-[28px] border border-slate-200 bg-slate-100/70 p-2 md:grid-cols-3">
        {[
          ["chrome", "Chrome Settings", "CTA, logo placement, footer brand"],
          ["menu", "Menu Builder", "Links, dropdowns, megamenus"],
          ["preview", "Structure Preview", "Audit the current navigation"],
        ].map(([id, label, description]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveChromeTool(id)}
            className={`rounded-2xl px-5 py-4 text-left transition ${
              activeChromeTool === id
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:bg-white/70"
            }`}
          >
            <span className="block text-sm font-black">{label}</span>
            <span className="mt-1 block text-xs font-semibold">{description}</span>
          </button>
        ))}
      </div>

      {activeChromeTool === "chrome" && (
      <Card className="p-8 mb-8 border-none shadow-xl bg-white">
        <h3 className="text-xl font-bold mb-8 italic flex items-center gap-3">
          <FaCog className="text-primary" />
          Navigation Config
        </h3>

        <form onSubmit={handleNavigationConfigSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              value={siteConfigFormData.navigationConfig.ctaLabel}
              onChange={(e) =>
                setSiteConfigFormData((current) => ({
                  ...current,
                  navigationConfig: {
                    ...current.navigationConfig,
                    ctaLabel: e.target.value,
                  },
                }))
              }
              placeholder="Primary CTA Label"
              className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
            />
            <input
              type="text"
              value={siteConfigFormData.navigationConfig.ctaHref}
              onChange={(e) =>
                setSiteConfigFormData((current) => ({
                  ...current,
                  navigationConfig: {
                    ...current.navigationConfig,
                    ctaHref: e.target.value,
                  },
                }))
              }
              placeholder="Primary CTA Link"
              className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
            />
            <input
              type="text"
              value={siteConfigFormData.navigationConfig.aboutLabel}
              onChange={(e) =>
                setSiteConfigFormData((current) => ({
                  ...current,
                  navigationConfig: {
                    ...current.navigationConfig,
                    aboutLabel: e.target.value,
                  },
                }))
              }
              placeholder="About Label"
              className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
            />
            <input
              type="text"
              value={siteConfigFormData.navigationConfig.aboutHref}
              onChange={(e) =>
                setSiteConfigFormData((current) => ({
                  ...current,
                  navigationConfig: {
                    ...current.navigationConfig,
                    aboutHref: e.target.value,
                  },
                }))
              }
              placeholder="About Link"
              className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
            />
            <select
              value={siteConfigFormData.navigationConfig.logoPlacement}
              onChange={(e) =>
                setSiteConfigFormData((current) => ({
                  ...current,
                  navigationConfig: {
                    ...current.navigationConfig,
                    logoPlacement: e.target.value,
                  },
                }))
              }
              className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
            >
              <option value="left">Logo Left</option>
              <option value="center">Logo Center</option>
            </select>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <h4 className="mb-5 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              Footer Structure
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ["brandName", "Footer Brand Name"],
                ["primaryCtaLabel", "Primary CTA Label"],
                ["primaryCtaHref", "Primary CTA Link"],
                ["secondaryCtaLabel", "Secondary CTA Label"],
                ["secondaryCtaHref", "Secondary CTA Link"],
                ["copyrightLabel", "Copyright Label"],
                ["mobileCopyrightLabel", "Mobile Copyright Label"],
              ].map(([key, placeholder]) => (
                <input
                  key={key}
                  type="text"
                  value={siteConfigFormData.footerConfig[key] || ""}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      footerConfig: {
                        ...current.footerConfig,
                        [key]: e.target.value,
                      },
                    }))
                  }
                  placeholder={placeholder}
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                />
              ))}
              <textarea
                rows={4}
                value={siteConfigFormData.footerConfig.brandDescription || ""}
                onChange={(e) =>
                  setSiteConfigFormData((current) => ({
                    ...current,
                    footerConfig: {
                      ...current.footerConfig,
                      brandDescription: e.target.value,
                    },
                  }))
                }
                placeholder="Footer brand description"
                className="md:col-span-2 w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="px-10">
              Save Navbar & Footer
            </Button>
          </div>
        </form>
      </Card>
      )}

      {activeChromeTool === "menu" && (
      <>
      <Card className="p-8 mb-8 border-none shadow-xl">
        <h3 className="text-xl font-bold mb-8 italic flex items-center gap-3">
          <FaBars className="text-primary" />
          {editingMenuId ? "Edit Menu Item" : "Add Menu Item"}
        </h3>

        <form className="space-y-6" onSubmit={handleMenuSubmit}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <input type="text" name="label" value={menuFormData.label} onChange={handleMenuInputChange} placeholder="Label" className="bg-gray-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold text-xs" required />
            <input type="text" name="link" value={menuFormData.link} onChange={handleMenuInputChange} placeholder="Link" className="bg-gray-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold text-xs" required />
            <select name="itemType" value={menuFormData.itemType} onChange={handleMenuInputChange} className="bg-gray-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-primary font-black uppercase text-[10px]">
              <option value="link">Link</option>
              <option value="dropdown">Dropdown</option>
              <option value="megamenu">Megamenu</option>
            </select>
            <input type="number" name="sortOrder" value={menuFormData.sortOrder} onChange={handleMenuInputChange} placeholder="Sort" className="bg-gray-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold text-xs" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <input type="text" name="categoryKey" value={menuFormData.categoryKey} onChange={handleMenuInputChange} placeholder="Key (safari)" className="bg-gray-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold text-xs" />
            <input type="text" name="menuTitle" value={menuFormData.menuTitle} onChange={handleMenuInputChange} placeholder="Megamenu Title" className="bg-gray-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold text-xs" />
            <select name="imageKey" value={menuFormData.imageKey} onChange={handleMenuInputChange} className="bg-gray-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-primary font-black uppercase text-[10px] col-span-2 lg:col-span-1">
              <option value="tembo">Tembo</option>
              <option value="kilimanjaro">Kilimanjaro</option>
              <option value="momentlion">Moment Lion</option>
              <option value="primate">Primate</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Child Links</label>
            <textarea name="childrenText" value={menuFormData.childrenText} onChange={handleMenuInputChange} placeholder={"Use one child per line in this format:\nOur Safari Packages | /packages?type=Safari"} className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary h-32" />
          </div>

          <div className="flex justify-end gap-3">
            {editingMenuId && (
              <Button type="button" variant="outline" onClick={resetMenuForm}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={loading}>
              {editingMenuId ? "Update Menu Item" : "Save Menu Item"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Card key={item._id || `${item.label}-${item.link}`} className="p-6 border-none shadow-md hover:shadow-lg">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary">{item.itemType}</Badge>
                  <Badge variant="secondary">#{item.sortOrder || 0}</Badge>
                </div>
                <h4 className="font-black text-xl text-slate-900">{item.label}</h4>
                <p className="text-sm text-primary font-bold break-all">{item.link}</p>
              </div>
              {item._id && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setMenuFormData({
                        label: item.label,
                        link: item.link,
                        itemType: item.itemType,
                        categoryKey: item.categoryKey || "",
                        menuTitle: item.menuTitle || "",
                        imageKey: item.imageKey || "tembo",
                        sortOrder: item.sortOrder || "",
                        childrenText: item.children?.map((child) => `${child.label} | ${child.link}`).join("\n") || "",
                      });
                      setEditingMenuId(item._id);
                      window.scrollTo(0, 0);
                    }}
                    className="text-[10px] text-primary font-black uppercase hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      (isPlatformMode
                        ? deletePlatformTenantMenuItem(tenantId, item._id)
                        : deleteMenuItem(item._id)
                      ).then(loadMenuItems)
                    }
                    className="text-[10px] text-red-500 font-black uppercase hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {item.menuTitle && (
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                {item.menuTitle}
              </p>
            )}

            {item.children?.length > 0 && (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <FaLink />
                  Child Links
                </p>
                <ul className="space-y-2">
                  {item.children.map((child) => (
                    <li key={`${child.label}-${child.link}`} className="text-sm font-bold text-slate-700">
                      {child.label}
                      <span className="block text-xs font-medium text-slate-400 break-all">
                        {child.link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
      </>
      )}

      {activeChromeTool === "preview" && (
        <Card className="p-8 border-none shadow-xl bg-white">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Current Structure</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">Navbar and footer audit</h3>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-950">Navbar CTA</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {siteConfigFormData.navigationConfig.ctaLabel || "No CTA"} → {siteConfigFormData.navigationConfig.ctaHref || "No link"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-950">Logo Placement</p>
              <p className="mt-2 text-sm font-semibold capitalize text-slate-500">
                {siteConfigFormData.navigationConfig.logoPlacement || "left"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-950">Footer Brand</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {siteConfigFormData.footerConfig.brandName || "No brand configured"}
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {menuItems.map((item) => (
              <div key={item._id || `${item.label}-${item.link}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">{item.label}</p>
                    <p className="text-xs font-semibold text-slate-500">{item.link}</p>
                  </div>
                  <Badge variant="secondary">{item.itemType}</Badge>
                </div>
              </div>
            ))}
            {!menuItems.length && (
              <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-bold text-slate-500">
                No menu items yet. Add links from the Menu Builder tab.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default NavigationManager;
