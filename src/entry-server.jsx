import React from "react";
import { renderToString } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { StaticRouter } from "react-router-dom/server";
import AppRoutes from "./AppRoutes";

export const render = (url) => {
  const helmetContext = {};
  const appHtml = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
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
