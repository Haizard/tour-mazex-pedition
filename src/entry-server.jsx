import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import AppProviders from "./AppProviders.jsx";
import AppShell from "./AppShell.jsx";

export const render = (url, routeData = {}) => {
  const helmetContext = {};
  const appHtml = renderToString(
    <AppProviders routeData={routeData} helmetContext={helmetContext}>
      <StaticRouter location={url}>
        <AppShell />
      </StaticRouter>
    </AppProviders>,
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
