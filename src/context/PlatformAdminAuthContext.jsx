import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchPlatformAdminSession, loginPlatformAdmin } from "../services/api";

const PLATFORM_ADMIN_TOKEN_KEY = "platformAdminAuthToken";
const isBrowser = typeof window !== "undefined";

const PlatformAdminAuthContext = createContext(null);

const readStoredToken = () => {
  if (!isBrowser) {
    return "";
  }

  return window.localStorage.getItem(PLATFORM_ADMIN_TOKEN_KEY) || "";
};

const persistToken = (token) => {
  if (!isBrowser) {
    return;
  }

  if (token) {
    window.localStorage.setItem(PLATFORM_ADMIN_TOKEN_KEY, token);
    return;
  }

  window.localStorage.removeItem(PLATFORM_ADMIN_TOKEN_KEY);
};

export const PlatformAdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(readStoredToken);
  const [platformAdmin, setPlatformAdmin] = useState(null);
  const [loading, setLoading] = useState(Boolean(readStoredToken()));

  const clearSession = () => {
    persistToken("");
    setToken("");
    setPlatformAdmin(null);
    setLoading(false);
  };

  const refreshSession = async () => {
    const currentToken = readStoredToken();

    if (!currentToken) {
      clearSession();
      return null;
    }

    setLoading(true);

    try {
      const response = await fetchPlatformAdminSession();
      setToken(currentToken);
      setPlatformAdmin(response.data.admin || null);
      return response.data;
    } catch (_error) {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    refreshSession();
  }, [token]);

  const login = async (credentials) => {
    const response = await loginPlatformAdmin(credentials);
    const nextToken = response.data.token || "";
    persistToken(nextToken);
    setToken(nextToken);
    setPlatformAdmin(response.data.admin || null);
    setLoading(false);
    return response.data;
  };

  const logout = () => {
    clearSession();
  };

  const value = useMemo(
    () => ({
      platformAdmin,
      token,
      loading,
      isAuthenticated: Boolean(token && platformAdmin),
      login,
      logout,
      refreshSession,
    }),
    [loading, platformAdmin, token]
  );

  return (
    <PlatformAdminAuthContext.Provider value={value}>
      {children}
    </PlatformAdminAuthContext.Provider>
  );
};

export const usePlatformAdminAuth = () => {
  const context = useContext(PlatformAdminAuthContext);

  if (!context) {
    throw new Error("usePlatformAdminAuth must be used within a PlatformAdminAuthProvider.");
  }

  return context;
};
