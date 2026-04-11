import React from "react";
import { BrowserRouter } from "react-router-dom";
import ScrollToTop from "./components/UI/ScrollToTop";
import AppRoutes from "./AppRoutes";
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
        <AppRoutes />
      </BrowserRouter>
    </>
  );
};

export default App;
