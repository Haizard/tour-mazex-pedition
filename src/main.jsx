import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "slick-carousel/slick/slick.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "slick-carousel/slick/slick-theme.css";
import AppProviders from "./AppProviders.jsx";
import { getClientRouteData } from "./utils/routeData.jsx";

const routeData = getClientRouteData();
const container = document.getElementById("root");

const app = (
  <React.StrictMode>
    <AppProviders routeData={routeData}>
      <App />
    </AppProviders>
  </React.StrictMode>
);

createRoot(container).render(app);
