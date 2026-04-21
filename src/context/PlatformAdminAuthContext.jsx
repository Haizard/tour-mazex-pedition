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
  // Always start with empty state so SSR and client initial renders match.
  const [token, setToken] = useState("");
  const [platformAdmin, setPlatformAdmin] = useState(null);
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      // Only clear session if the server explicitly rejects the token
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearSession();
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // On mount (client-only), rehydrate auth state from localStorage.
  useEffect(() => {
    const storedToken = readStoredToken();
    if (storedToken) {
      setToken(storedToken);
      setLoading(true);
      refreshSession();
    }
  }, []);

  // Keep token in sync when it changes.
  useEffect(() => {
    persistToken(token);
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
