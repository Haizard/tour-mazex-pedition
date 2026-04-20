import React from "react";
import { HelmetProvider } from "react-helmet-async";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { PlatformAdminAuthProvider } from "./context/PlatformAdminAuthContext.jsx";
import { TenantProvider } from "./context/TenantContext.jsx";
import { RouteDataProvider } from "./utils/routeData.jsx";

const AppProviders = ({ children, routeData = {}, helmetContext }) => (
  <HelmetProvider context={helmetContext}>
    <TenantProvider>
      <AdminAuthProvider>
        <PlatformAdminAuthProvider>
          <RouteDataProvider data={routeData}>{children}</RouteDataProvider>
        </PlatformAdminAuthProvider>
      </AdminAuthProvider>
    </TenantProvider>
  </HelmetProvider>
);

export default AppProviders;
