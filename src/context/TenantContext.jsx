import React from "react";
import { fetchTenantBootstrap } from "../services/api";

const defaultTenantContext = {
  tenant: null,
  theme: null,
  siteConfig: null,
  siteSettings: null,
  bootstrapError: "",
  loading: true,
};

const TenantContext = React.createContext(defaultTenantContext);

const applyTenantTheme = (theme) => {
  if (typeof document === "undefined" || !theme) {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty("--tenant-color-primary", theme.primaryColor || "#0d9488");
  root.style.setProperty("--tenant-color-secondary", theme.secondaryColor || "#eab308");
  root.style.setProperty("--tenant-color-accent", theme.accentColor || "#f97316");
  root.style.setProperty("--tenant-color-background", theme.backgroundColor || "#ffffff");
  root.style.setProperty("--tenant-color-surface", theme.surfaceColor || "#f8fafc");
  root.style.setProperty("--tenant-color-text", theme.textColor || "#1e293b");
  root.style.setProperty("--tenant-color-heading", theme.headingColor || "#0f172a");
  root.style.setProperty("--tenant-font-heading", theme.headingFont || "'Playfair Display', serif");
  root.style.setProperty("--tenant-font-body", theme.bodyFont || "'Montserrat', sans-serif");
  root.style.setProperty("--tenant-radius-base", theme.borderRadius || "1rem");
  root.style.setProperty("--tenant-radius-card", theme.cardRadius || "1.5rem");
  root.style.setProperty("--tenant-radius-button", theme.buttonRadius || "9999px");
  root.style.setProperty("--tenant-shadow", theme.shadowStyle || "0 10px 30px rgba(15, 23, 42, 0.12)");
  root.style.setProperty("--tenant-spacing-scale", theme.spacingScale || "1");
};

export const TenantProvider = ({ children }) => {
  const [state, setState] = React.useState(defaultTenantContext);

  const loadTenantBootstrap = React.useCallback(async () => {
    const timeoutMs = 12000;
    let timeoutId = null;

    try {
      return await Promise.race([
        fetchTenantBootstrap(),
        new Promise((_, reject) => {
          timeoutId = window.setTimeout(() => {
            reject(new Error("Tenant bootstrap timed out."));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }
  }, []);

  const refreshTenant = React.useCallback(async () => {
    const response = await loadTenantBootstrap();
    const nextState = {
      tenant: response.data?.tenant || null,
      theme: response.data?.theme || null,
      siteConfig: response.data?.siteConfig || null,
      siteSettings: response.data?.siteSettings || null,
      bootstrapError: "",
      loading: false,
    };

    applyTenantTheme(nextState.theme);
    setState(nextState);
    return nextState;
  }, [loadTenantBootstrap]);

  React.useEffect(() => {
    let active = true;

    const loadTenant = async () => {
      try {
        const response = await loadTenantBootstrap();
        if (!active) {
          return;
        }

        const nextState = {
          tenant: response.data?.tenant || null,
          theme: response.data?.theme || null,
          siteConfig: response.data?.siteConfig || null,
          siteSettings: response.data?.siteSettings || null,
          bootstrapError: "",
          loading: false,
        };

        applyTenantTheme(nextState.theme);
        setState(nextState);
      } catch (error) {
        console.error("Failed to load tenant bootstrap:", error);
        if (active) {
          setState((current) => ({
            ...current,
            bootstrapError: error.message || "Unable to load tenant website.",
            loading: false,
          }));
        }
      }
    };

    loadTenant();

    return () => {
      active = false;
    };
  }, [loadTenantBootstrap]);

  return (
    <TenantContext.Provider value={{ ...state, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => React.useContext(TenantContext);
