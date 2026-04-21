import React from "react";
import { BrowserRouter } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import AppShell from "./AppShell";

const App = () => {
  React.useEffect(() => {
    // Delay AOS initialization to ensure hydration is complete
    requestAnimationFrame(() => {
      AOS.init({
        offset: 100,
        duration: 900,
        easing: "ease-in-sine",
        delay: 100,
        once: true, // Only animate once to reduce DOM thrashing
      });
      AOS.refresh();
    });
  }, []);

  return (
    <>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </>
  );
};

export default App;
