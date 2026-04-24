import React from "react";
import { BrowserRouter } from "react-router-dom";
import "aos/dist/aos.css";
import AppShell from "./AppShell";

const App = () => {
  React.useEffect(() => {
    let active = true;

    // Delay animation boot so the tenant shell can paint before optional UI effects load.
    requestAnimationFrame(() => {
      import("aos")
        .then(({ default: AOS }) => {
          if (!active) {
            return;
          }

          AOS.init({
            offset: 100,
            duration: 900,
            easing: "ease-in-sine",
            delay: 100,
            once: true,
          });
          AOS.refresh();
        })
        .catch(() => {
          // Avoid blocking the public app if the animation library fails to load.
        });
    });

    return () => {
      active = false;
    };
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
