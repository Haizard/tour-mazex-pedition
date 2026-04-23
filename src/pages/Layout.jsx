import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import OrderPopup from "../components/OrderPopup/OrderPopup";
import ChatBot from "../components/Chat/ChatBot";
import WhatsAppButton from "../components/WhatsApp/WhatsAppButton";
import { useTenant } from "../context/TenantContext";

const Layout = () => {
  const [orderPopup, setOrderPopup] = React.useState(false);
  const location = useLocation();
  const { loading } = useTenant();

  const handleOrderPopup = () => {
    setOrderPopup((prev) => !prev);
  };

  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/platform") ||
    location.pathname.startsWith("/super-admin") ||
    /^\/demo\/[^/]+\/(admin|login)(\/|$)/.test(location.pathname);
  const shouldAutoPrompt =
    !isAdminRoute &&
    !location.pathname.endsWith("/plan-my-trip") &&
    !location.pathname.endsWith("/tailor-made");

  React.useEffect(() => {
    if (!shouldAutoPrompt) {
      return;
    }

    const popupWasShown = window.sessionStorage.getItem(
      "plan-my-trip-popup-shown"
    );

    if (popupWasShown) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setOrderPopup(true);
      window.sessionStorage.setItem("plan-my-trip-popup-shown", "true");
    }, 1200);

    return () => window.clearTimeout(timerId);
  }, [shouldAutoPrompt, location.pathname]);

  if (!isAdminRoute && loading) {
    return (
      <main className="min-h-screen bg-white" aria-busy="true" aria-label="Loading tenant website">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
        </div>
      </main>
    );
  }

  return (
    <>
      {!isAdminRoute && <Navbar handleOrderPopup={handleOrderPopup} />}
      <Outlet />
      {!isAdminRoute && (
        <>
          <ChatBot />
          <WhatsAppButton />
          <Footer />
        </>
      )}
      <OrderPopup
        isVisible={orderPopup}
        setOrderPopupVisible={setOrderPopup}
      />
    </>
  );
};

export default Layout;
