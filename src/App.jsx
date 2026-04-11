import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import PlanMyTrip from "./pages/PlanMyTrip";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import ScrollToTop from "./components/UI/ScrollToTop";
import AOS from "aos";
import "aos/dist/aos.css";

const App = () => {
  React.useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 900,
      easing: "ease-in-sine",
      delay: 100,
    });
    AOS.refresh();
  }, []);

  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
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
            <Route path="gallery" element={<Gallery />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="login" element={<AdminLogin />} />
            <Route path="plan-my-trip" element={<PlanMyTrip />} />
            <Route path="tailor-made" element={<PlanMyTrip />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<TermsConditions />} />
            <Route path="*" element={<NoPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
