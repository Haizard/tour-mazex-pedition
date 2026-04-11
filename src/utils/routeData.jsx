import React from "react";

const RouteDataContext = React.createContext({});

export const RouteDataProvider = ({ data = {}, children }) => (
  <RouteDataContext.Provider value={data}>{children}</RouteDataContext.Provider>
);

export const useRouteData = () => React.useContext(RouteDataContext) || {};

export const getClientRouteData = () => {
  if (typeof window === "undefined") return {};
  return window.__PRERENDER_DATA__ || {};
};
