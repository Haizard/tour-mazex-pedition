import React from "react";
import { renderToString } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { StaticRouter } from "react-router-dom/server";
import AppRoutes from "./AppRoutes";
import { RouteDataProvider } from "./utils/routeData.jsx";

export const render = (url, routeData = {}) => {
  const helmetContext = {};
  const appHtml = renderToString(
    <HelmetProvider context={helmetContext}>
      <RouteDataProvider data={routeData}>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </RouteDataProvider>
    </HelmetProvider>,
  );

  return {
    appHtml,
    headTags: helmetContext.helmet
      ? [
          helmetContext.helmet.title?.toString() || "",
          helmetContext.helmet.priority?.toString() || "",
          helmetContext.helmet.meta?.toString() || "",
          helmetContext.helmet.link?.toString() || "",
          helmetContext.helmet.script?.toString() || "",
        ].join("")
      : "",
  };
};
