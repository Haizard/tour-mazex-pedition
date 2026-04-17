import React from "react";
import { fetchTenantBootstrap } from "../services/api";

const defaultTenantContext = {
  tenant: null,
  theme: null,
  siteConfig: null,
  siteSettings: null,
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

  const refreshTenant = React.useCallback(async () => {
    const response = await fetchTenantBootstrap();
    const nextState = {
      tenant: response.data?.tenant || null,
      theme: response.data?.theme || null,
      siteConfig: response.data?.siteConfig || null,
      siteSettings: response.data?.siteSettings || null,
      loading: false,
    };

    applyTenantTheme(nextState.theme);
    setState(nextState);
    return nextState;
  }, []);

  React.useEffect(() => {
    let active = true;

    const loadTenant = async () => {
      try {
        const response = await fetchTenantBootstrap();
        if (!active) {
          return;
        }

        const nextState = {
          tenant: response.data?.tenant || null,
          theme: response.data?.theme || null,
          siteConfig: response.data?.siteConfig || null,
          siteSettings: response.data?.siteSettings || null,
          loading: false,
        };

        applyTenantTheme(nextState.theme);
        setState(nextState);
      } catch (error) {
        console.error("Failed to load tenant bootstrap:", error);
        if (active) {
          setState((current) => ({ ...current, loading: false }));
        }
      }
    };

    loadTenant();

    return () => {
      active = false;
    };
  }, []);

  return (
    <TenantContext.Provider value={{ ...state, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => React.useContext(TenantContext);
