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
import AdminLogin from "./pages/AdminLogin";
import AdminRoute from "./components/Admin/AdminRoute";
import PlatformAdminRoute from "./components/Admin/PlatformAdminRoute";
import PlatformAdminLogin from "./pages/PlatformAdminLogin";
import PlanMyTrip from "./pages/PlanMyTrip";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";

const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const PlatformAdminDashboard = React.lazy(() => import("./pages/PlatformAdminDashboard"));

const DashboardRouteFallback = ({ label }) => (
  <main className="min-h-[60vh] bg-[#f6f7f9] px-6 py-16">
    <div className="mx-auto max-w-4xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">
        Workspace Loading
      </p>
      <h1 className="mt-3 text-2xl font-black tracking-tight text-zinc-950">{label}</h1>
      <div className="mt-6 space-y-3">
        <div className="h-3 w-40 animate-pulse rounded-full bg-zinc-200" />
        <div className="h-12 w-full animate-pulse rounded-2xl bg-zinc-100" />
        <div className="h-40 w-full animate-pulse rounded-3xl bg-zinc-100" />
      </div>
    </div>
  </main>
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
            <Suspense fallback={<DashboardRouteFallback label="Loading tenant admin workspace" />}>
              <AdminDashboard />
            </Suspense>
          </AdminRoute>
        )}
      />
      <Route path="login" element={<AdminLogin />} />
      <Route path="admin/login" element={<AdminLogin />} />
      <Route
        path="platform"
        element={(
          <PlatformAdminRoute>
            <Suspense fallback={<DashboardRouteFallback label="Loading platform control workspace" />}>
              <PlatformAdminDashboard />
            </Suspense>
          </PlatformAdminRoute>
        )}
      />
      <Route path="platform/login" element={<PlatformAdminLogin />} />
      <Route
        path="super-admin"
        element={(
          <PlatformAdminRoute>
            <Suspense fallback={<DashboardRouteFallback label="Loading platform control workspace" />}>
              <PlatformAdminDashboard />
            </Suspense>
          </PlatformAdminRoute>
        )}
      />
      <Route path="super-admin/login" element={<PlatformAdminLogin />} />
      <Route path="*" element={<DynamicTenantPage />} />
    </Route>
    <Route path="/demo/:tenantSlug" element={<Layout />}>
      {tenantSiteRoutes}
      <Route
        path="admin"
        element={(
          <AdminRoute>
            <Suspense fallback={<DashboardRouteFallback label="Loading tenant admin workspace" />}>
              <AdminDashboard />
            </Suspense>
          </AdminRoute>
        )}
      />
      <Route path="login" element={<AdminLogin />} />
      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="*" element={<DynamicTenantPage />} />
    </Route>
  </Routes>
);

export default AppRoutes;
