/* eslint-disable react/prop-types */
import { HelmetProvider } from "react-helmet-async";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { PlatformAdminAuthProvider } from "./context/PlatformAdminAuthContext.jsx";
import { TenantProvider } from "./context/TenantContext.jsx";
import { TravelerAuthProvider } from "./context/TravelerAuthContext.jsx";
import AppErrorBoundary from "./components/UI/AppErrorBoundary.jsx";
import { RouteDataProvider } from "./utils/routeData.jsx";

const AppProviders = ({ children, routeData = {}, helmetContext }) => (
  <HelmetProvider context={helmetContext}>
    <AppErrorBoundary>
      <TenantProvider>
        <AdminAuthProvider>
          <PlatformAdminAuthProvider>
            <TravelerAuthProvider>
              <RouteDataProvider data={routeData}>{children}</RouteDataProvider>
            </TravelerAuthProvider>
          </PlatformAdminAuthProvider>
        </AdminAuthProvider>
      </TenantProvider>
    </AppErrorBoundary>
  </HelmetProvider>
);

export default AppProviders;
