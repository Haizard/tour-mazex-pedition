import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import "./index.css";
import "slick-carousel/slick/slick.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "slick-carousel/slick/slick-theme.css";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { TenantProvider } from "./context/TenantContext.jsx";
import { getClientRouteData, RouteDataProvider } from "./utils/routeData.jsx";

const routeData = getClientRouteData();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <TenantProvider>
        <AdminAuthProvider>
          <RouteDataProvider data={routeData}>
            <App />
          </RouteDataProvider>
        </AdminAuthProvider>
      </TenantProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
