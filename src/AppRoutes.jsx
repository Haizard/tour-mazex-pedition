import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Blogs from "./pages/Blogs";
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
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminRoute from "./components/Admin/AdminRoute";
import PlatformAdminRoute from "./components/Admin/PlatformAdminRoute";
import PlatformAdminDashboard from "./pages/PlatformAdminDashboard";
import PlatformAdminLogin from "./pages/PlatformAdminLogin";
import PlanMyTrip from "./pages/PlanMyTrip";
import PricingPage from "./pages/PricingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";

const tenantSiteRoutes = (
  <>
    <Route index element={<Home />} />
    <Route path="blogs" element={<Blogs />} />
    <Route path="blogs/:title" element={<BlogDetail />} />
    <Route path="blogs/category/:categoryId" element={<BlogCategory />} />
    <Route path="packages" element={<PackagesPage />} />
    <Route path="packages/:title" element={<PackageDetail />} />
    <Route path="best-places" element={<PlacesRoute />} />
    <Route path="destinations" element={<PlacesRoute />} />
    <Route path="destinations/:destinationSlug" element={<DestinationDetail />} />
    <Route path="about" element={<About />} />
    <Route path="contact" element={<Contact />} />
    <Route path="pricing" element={<PricingPage />} />
    <Route path="gallery" element={<Gallery />} />
    <Route path="plan-my-trip" element={<PlanMyTrip />} />
    <Route path="tailor-made" element={<PlanMyTrip />} />
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
            <AdminDashboard />
          </AdminRoute>
        )}
      />
      <Route path="login" element={<AdminLogin />} />
      <Route path="admin/login" element={<AdminLogin />} />
      <Route
        path="platform"
        element={(
          <PlatformAdminRoute>
            <PlatformAdminDashboard />
          </PlatformAdminRoute>
        )}
      />
      <Route path="platform/login" element={<PlatformAdminLogin />} />
      <Route
        path="super-admin"
        element={(
          <PlatformAdminRoute>
            <PlatformAdminDashboard />
          </PlatformAdminRoute>
        )}
      />
      <Route path="super-admin/login" element={<PlatformAdminLogin />} />
      <Route path="*" element={<NoPage />} />
    </Route>
    <Route path="/demo/:tenantSlug" element={<Layout />}>
      {tenantSiteRoutes}
      <Route
        path="admin"
        element={(
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        )}
      />
      <Route path="login" element={<AdminLogin />} />
      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="*" element={<NoPage />} />
    </Route>
  </Routes>
);

export default AppRoutes;
