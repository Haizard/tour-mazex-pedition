/* eslint-disable react/prop-types, react-refresh/only-export-components */
import React from "react";
import { fetchTravelerSession } from "../services/api";
import {
  clearTravelerSession,
  getTravelerDisplayName,
  getTravelerInitials,
  persistTravelerSession,
  readStoredTravelerSession,
} from "../components/Auth/travelerAuthSession.js";

const isBrowser = typeof window !== "undefined";

const TravelerAuthContext = React.createContext(null);

const getStorage = () => (isBrowser ? window.localStorage : null);

export const TravelerAuthProvider = ({ children }) => {
  const [token, setToken] = React.useState("");
  const [traveler, setTraveler] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const clearSession = React.useCallback(() => {
    clearTravelerSession(getStorage());
    setToken("");
    setTraveler(null);
    setLoading(false);
  }, []);

  const applySession = React.useCallback(({ token: nextToken = "", traveler: nextTraveler = null } = {}) => {
    persistTravelerSession(
      {
        token: nextToken,
        traveler: nextTraveler,
      },
      getStorage()
    );
    setToken(nextToken);
    setTraveler(nextTraveler);
  }, []);

  const refreshSession = React.useCallback(async () => {
    const stored = readStoredTravelerSession(getStorage());

    if (!stored.token) {
      clearSession();
      return null;
    }

    setToken(stored.token);
    if (stored.traveler) {
      setTraveler(stored.traveler);
    }
    setLoading(true);

    try {
      const response = await fetchTravelerSession();
      const nextTraveler = response.data?.traveler || null;
      applySession({ token: stored.token, traveler: nextTraveler });
      return nextTraveler;
    } catch (_error) {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [applySession, clearSession]);

  React.useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const stored = readStoredTravelerSession(window.localStorage);
    if (!stored.token) {
      return;
    }

    setToken(stored.token);
    setTraveler(stored.traveler);
    refreshSession();
  }, [refreshSession]);

  const logout = React.useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = React.useMemo(
    () => ({
      token,
      traveler,
      loading,
      isAuthenticated: Boolean(token && traveler),
      travelerProfileLabel: traveler ? getTravelerDisplayName(traveler) : "",
      travelerInitials: traveler ? getTravelerInitials(traveler) : "T",
      refreshSession,
      logout,
    }),
    [loading, logout, refreshSession, token, traveler]
  );

  return (
    <TravelerAuthContext.Provider value={value}>
      {children}
    </TravelerAuthContext.Provider>
  );
};

export const useTravelerAuth = () => {
  const context = React.useContext(TravelerAuthContext);

  if (!context) {
    throw new Error("useTravelerAuth must be used within a TravelerAuthProvider.");
  }

  return context;
};
