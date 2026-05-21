import React, { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { useTenant } from "../context/TenantContext";
import {
  TRAVELER_AUTH_TOKEN_KEY,
  TRAVELER_GOOGLE_PROMPT_DELAY_MS,
  TRAVELER_GOOGLE_PROMPT_DISMISSED_KEY,
  shouldScheduleTravelerGooglePrompt,
} from "../components/Auth/travelerGooglePromptState";

const OrderPopup = React.lazy(() => import("../components/OrderPopup/OrderPopup"));
const ChatBot = React.lazy(() => import("../components/Chat/ChatBot"));
const WhatsAppButton = React.lazy(() => import("../components/WhatsApp/WhatsAppButton"));
const TravelerGooglePrompt = React.lazy(() => import("../components/Auth/TravelerGooglePrompt"));

const Layout = () => {
  const [orderPopup, setOrderPopup] = React.useState(false);
  const [travelerGooglePromptVisible, setTravelerGooglePromptVisible] = React.useState(false);
  const location = useLocation();
  const { loading, bootstrapError, isPlatform } = useTenant();

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
    !isPlatform &&
    !location.pathname.endsWith("/plan-my-trip") &&
    !location.pathname.endsWith("/tailor-made");
  const shouldLoadAssistiveWidgets = !isAdminRoute && !isPlatform;

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

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const shouldSchedule = shouldScheduleTravelerGooglePrompt({
      pathname: location.pathname,
      isAdminRoute,
      isPlatform,
      isDismissed: window.sessionStorage.getItem(TRAVELER_GOOGLE_PROMPT_DISMISSED_KEY) === "true",
      isSignedIn: Boolean(window.localStorage.getItem(TRAVELER_AUTH_TOKEN_KEY)),
    });

    if (!shouldSchedule) {
      setTravelerGooglePromptVisible(false);
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setTravelerGooglePromptVisible(true);
    }, TRAVELER_GOOGLE_PROMPT_DELAY_MS);

    return () => window.clearTimeout(timerId);
  }, [isAdminRoute, isPlatform, location.pathname]);

  if (!isAdminRoute && loading) {
    return (
      <main className="min-h-screen bg-white" aria-busy="true" aria-label="Loading tenant website">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
        </div>
      </main>
    );
  }

  if (!isAdminRoute && bootstrapError) {
    return (
      <main className="min-h-screen bg-white px-6 py-24">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
            Tenant Bootstrap
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            The website is taking too long to load.
          </h1>
          <p className="mt-4 text-sm font-medium leading-6 text-slate-600">
            {bootstrapError}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white"
          >
            Retry Loading
          </button>
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
          <Suspense fallback={null}>
            {shouldLoadAssistiveWidgets && <ChatBot />}
            {shouldLoadAssistiveWidgets && <WhatsAppButton />}
          </Suspense>
          <Footer />
        </>
      )}
      <Suspense fallback={null}>
        {orderPopup && (
          <OrderPopup
            isVisible={orderPopup}
            setOrderPopupVisible={setOrderPopup}
          />
        )}
        {travelerGooglePromptVisible && (
          <TravelerGooglePrompt
            onDismiss={() => setTravelerGooglePromptVisible(false)}
          />
        )}
      </Suspense>
    </>
  );
};

export default Layout;
