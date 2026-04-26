import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import ConfiguredPage from "./pages/ConfiguredPage";
import DynamicTenantPage from "./pages/DynamicTenantPage";
import AdminLogin from "./pages/AdminLogin";
import AdminRoute from "./components/Admin/AdminRoute";
import PlatformAdminRoute from "./components/Admin/PlatformAdminRoute";
import PlatformAdminLogin from "./pages/PlatformAdminLogin";


const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const PlatformAdminDashboard = React.lazy(() => import("./pages/PlatformAdminDashboard"));
const Blogs = React.lazy(() => import("./pages/Blogs"));
const PlacesRoute = React.lazy(() => import("./pages/PlacesRoute"));
const DestinationDetail = React.lazy(() => import("./pages/DestinationDetail"));
const About = React.lazy(() => import("./pages/About"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Gallery = React.lazy(() => import("./pages/Gallery"));
const PackageDetail = React.lazy(() => import("./components/Blogs/PackageDetail"));
const PackagesPage = React.lazy(() => import("./pages/PackagesPage"));
const BlogDetail = React.lazy(() => import("./components/Blogs/BlogDetail"));
const BlogCategory = React.lazy(() => import("./pages/BlogCategory"));
const PlanMyTrip = React.lazy(() => import("./pages/PlanMyTrip"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = React.lazy(() => import("./pages/TermsConditions"));
const QuotePublicView = React.lazy(() => import("./pages/QuotePublicView"));
const FeedbackPublicView = React.lazy(() => import("./pages/FeedbackPublicView"));
const PaymentPublicView = React.lazy(() => import("./pages/PaymentPublicView"));

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

const PublicRouteFallback = () => (
  <div className="min-h-[45vh] bg-white pt-24">
    <div className="container mx-auto max-w-5xl px-4">
      <div className="h-3 w-36 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-5 h-12 w-full max-w-xl animate-pulse rounded-2xl bg-slate-100" />
      <div className="mt-5 h-52 w-full animate-pulse rounded-3xl bg-slate-100" />
    </div>
  </div>
);

const withPublicSuspense = (element) => (
  <Suspense fallback={<PublicRouteFallback />}>
    {element}
  </Suspense>
);

const tenantSiteRoutes = (
  <>
    <Route index element={<Home />} />
    <Route path="blogs" element={<ConfiguredPage pageType="blogs" fallback={Blogs} />} />
    <Route path="blogs/:title" element={<ConfiguredPage pageType="blog-detail" fallback={BlogDetail} />} />
    <Route path="blogs/category/:categoryId" element={withPublicSuspense(<BlogCategory />)} />
    <Route path="packages" element={<ConfiguredPage pageType="tours" fallback={PackagesPage} />} />
    <Route path="tours" element={<ConfiguredPage pageType="tours" fallback={PackagesPage} />} />
    <Route path="packages/:title" element={<ConfiguredPage pageType="tour-detail" fallback={PackageDetail} />} />
    <Route path="best-places" element={withPublicSuspense(<PlacesRoute />)} />
    <Route path="destinations" element={withPublicSuspense(<PlacesRoute />)} />
    <Route path="destinations/:destinationSlug" element={withPublicSuspense(<DestinationDetail />)} />
    <Route path="about" element={withPublicSuspense(<About />)} />
    <Route path="contact" element={<ConfiguredPage pageType="contact" fallback={Contact} />} />
    <Route path="gallery" element={withPublicSuspense(<Gallery />)} />
    <Route path="plan-my-trip" element={withPublicSuspense(<PlanMyTrip />)} />
    <Route path="tailor-made" element={<ConfiguredPage pageType="tailor-made" fallback={PlanMyTrip} />} />
    <Route path="landing" element={<ConfiguredPage pageType="landing" />} />
    <Route path="privacy-policy" element={withPublicSuspense(<PrivacyPolicy />)} />
    <Route path="terms" element={withPublicSuspense(<TermsConditions />)} />
    <Route path="quote/:token" element={withPublicSuspense(<QuotePublicView />)} />
    <Route path="feedback/:token" element={withPublicSuspense(<FeedbackPublicView />)} />
    <Route path="payment/:token" element={withPublicSuspense(<PaymentPublicView />)} />
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
