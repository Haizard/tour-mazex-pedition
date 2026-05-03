import React from "react";
import { HelmetProvider } from "react-helmet-async";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { PlatformAdminAuthProvider } from "./context/PlatformAdminAuthContext.jsx";
import { TenantProvider } from "./context/TenantContext.jsx";
import AppErrorBoundary from "./components/UI/AppErrorBoundary.jsx";
import { RouteDataProvider } from "./utils/routeData.jsx";

const AppProviders = ({ children, routeData = {}, helmetContext }) => (
  <HelmetProvider context={helmetContext}>
    <AppErrorBoundary>
      <TenantProvider>
        <AdminAuthProvider>
          <PlatformAdminAuthProvider>
            <RouteDataProvider data={routeData}>{children}</RouteDataProvider>
          </PlatformAdminAuthProvider>
        </AdminAuthProvider>
      </TenantProvider>
    </AppErrorBoundary>
  </HelmetProvider>
);

export default AppProviders;
