import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import OrderPopup from "../components/OrderPopup/OrderPopup";
import ChatBot from "../components/Chat/ChatBot";
import WhatsAppButton from "../components/WhatsApp/WhatsAppButton";

const Layout = () => {
  const [orderPopup, setOrderPopup] = React.useState(false);
  const location = useLocation();

  const handleOrderPopup = () => {
    setOrderPopup((prev) => !prev);
  };

  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/login") ||
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
