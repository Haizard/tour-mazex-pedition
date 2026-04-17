import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchAdminSession, loginAdmin } from "../services/api";

const ADMIN_TOKEN_KEY = "adminAuthToken";
const isBrowser = typeof window !== "undefined";

const AdminAuthContext = createContext(null);

const readStoredToken = () => {
  if (!isBrowser) {
    return "";
  }

  return window.localStorage.getItem(ADMIN_TOKEN_KEY) || "";
};

const persistToken = (token) => {
  if (!isBrowser) {
    return;
  }

  if (token) {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
    return;
  }

  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(readStoredToken);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(Boolean(readStoredToken()));

  const clearSession = () => {
    persistToken("");
    setToken("");
    setAdmin(null);
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
      const response = await fetchAdminSession();
      setToken(currentToken);
      setAdmin(response.data.admin || null);
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
    const response = await loginAdmin(credentials);
    const nextToken = response.data.token || "";
    persistToken(nextToken);
    setToken(nextToken);
    setAdmin(response.data.admin || null);
    setLoading(false);
    return response.data;
  };

  const logout = () => {
    clearSession();
  };

  const value = useMemo(
    () => ({
      admin,
      token,
      loading,
      isAuthenticated: Boolean(token && admin),
      login,
      logout,
      refreshSession,
    }),
    [admin, loading, token]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider.");
  }

  return context;
};
