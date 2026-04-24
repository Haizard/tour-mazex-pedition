import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Blogs from "./pages/Blogs";
import ConfiguredPage from "./pages/ConfiguredPage";
import DynamicTenantPage from "./pages/DynamicTenantPage";
import NoPage from "./pages/NoPage";
import PlacesRoute from "./pages/PlacesRoute";
import DestinationDetail from "./pages/DestinationDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import PackageDetail from "./components/Blogs/PackageDetail";
import PackagesPage from "./pages/PackagesPage";
import BlogDetail from "./components/Blogs/BlogDetail";
import BlogCategory from "./pages/BlogCategory";
import AdminRoute from "./components/Admin/AdminRoute";
import PlatformAdminRoute from "./components/Admin/PlatformAdminRoute";
import PlanMyTrip from "./pages/PlanMyTrip";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";

const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = React.lazy(() => import("./pages/AdminLogin"));
const PlatformAdminDashboard = React.lazy(() => import("./pages/PlatformAdminDashboard"));
const PlatformAdminLogin = React.lazy(() => import("./pages/PlatformAdminLogin"));

const RouteSuspense = ({ children }) => (
  <Suspense
    fallback={(
      <main className="min-h-[50vh] bg-white" aria-busy="true">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
        </div>
      </main>
    )}
  >
    {children}
  </Suspense>
);

const tenantSiteRoutes = (
  <>
    <Route index element={<Home />} />
    <Route path="blogs" element={<ConfiguredPage pageType="blogs" fallback={Blogs} />} />
    <Route path="blogs/:title" element={<ConfiguredPage pageType="blog-detail" fallback={BlogDetail} />} />
    <Route path="blogs/category/:categoryId" element={<BlogCategory />} />
    <Route path="packages" element={<ConfiguredPage pageType="tours" fallback={PackagesPage} />} />
    <Route path="tours" element={<ConfiguredPage pageType="tours" fallback={PackagesPage} />} />
    <Route path="packages/:title" element={<ConfiguredPage pageType="tour-detail" fallback={PackageDetail} />} />
    <Route path="best-places" element={<PlacesRoute />} />
    <Route path="destinations" element={<PlacesRoute />} />
    <Route path="destinations/:destinationSlug" element={<DestinationDetail />} />
    <Route path="about" element={<About />} />
    <Route path="contact" element={<ConfiguredPage pageType="contact" fallback={Contact} />} />
    <Route path="gallery" element={<Gallery />} />
    <Route path="plan-my-trip" element={<PlanMyTrip />} />
    <Route path="tailor-made" element={<ConfiguredPage pageType="tailor-made" fallback={PlanMyTrip} />} />
    <Route path="landing" element={<ConfiguredPage pageType="landing" />} />
    <Route path="privacy-policy" element={<PrivacyPolicy />} />
    <Route path="terms" element={<TermsConditions />} />
  </>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      {tenantSiteRoutes}
      <Route
        path="admin"
        element={(
          <AdminRoute>
            <RouteSuspense>
              <AdminDashboard />
            </RouteSuspense>
          </AdminRoute>
        )}
      />
      <Route path="login" element={<RouteSuspense><AdminLogin /></RouteSuspense>} />
      <Route path="admin/login" element={<RouteSuspense><AdminLogin /></RouteSuspense>} />
      <Route
        path="platform"
        element={(
          <PlatformAdminRoute>
            <RouteSuspense>
              <PlatformAdminDashboard />
            </RouteSuspense>
          </PlatformAdminRoute>
        )}
      />
      <Route path="platform/login" element={<RouteSuspense><PlatformAdminLogin /></RouteSuspense>} />
      <Route
        path="super-admin"
        element={(
          <PlatformAdminRoute>
            <RouteSuspense>
              <PlatformAdminDashboard />
            </RouteSuspense>
          </PlatformAdminRoute>
        )}
      />
      <Route path="super-admin/login" element={<RouteSuspense><PlatformAdminLogin /></RouteSuspense>} />
      <Route path="*" element={<DynamicTenantPage />} />
    </Route>
    <Route path="/demo/:tenantSlug" element={<Layout />}>
      {tenantSiteRoutes}
      <Route
        path="admin"
        element={(
          <AdminRoute>
            <RouteSuspense>
              <AdminDashboard />
            </RouteSuspense>
          </AdminRoute>
        )}
      />
      <Route path="login" element={<RouteSuspense><AdminLogin /></RouteSuspense>} />
      <Route path="admin/login" element={<RouteSuspense><AdminLogin /></RouteSuspense>} />
      <Route path="*" element={<DynamicTenantPage />} />
    </Route>
  </Routes>
);

export default AppRoutes;
