import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (relativePath) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");

test("platform home is a dedicated product landing page instead of only discovery", () => {
  const homeSource = readSource("src/pages/Home.jsx");
  const platformHomeSource = readSource("src/pages/PlatformHome.jsx");

  assert.match(homeSource, /PlatformHome/);
  assert.doesNotMatch(homeSource, /<GlobalDiscovery \/>/);
  assert.match(platformHomeSource, /AI-powered tourism growth platform/);
  assert.match(platformHomeSource, /Capture/);
  assert.match(platformHomeSource, /Nurture/);
  assert.match(platformHomeSource, /Close/);
  assert.match(platformHomeSource, /Reactivate/);
  assert.match(platformHomeSource, /to="\/discover"/);
  assert.match(platformHomeSource, /to="\/pricing"/);
});

test("platform navigation and footer expose meaningful product links", () => {
  const navbarSource = readSource("src/components/Navbar/Navbar.jsx");
  const footerSource = readSource("src/components/Footer/Footer.jsx");
  const routesSource = readSource("src/AppRoutes.jsx");

  assert.match(navbarSource, /Features/);
  assert.match(navbarSource, /Pricing/);
  assert.match(navbarSource, /Operators/);
  assert.match(footerSource, /For Operators/);
  assert.match(footerSource, /Affiliate Partners/);
  assert.match(footerSource, /Security/);
  assert.match(routesSource, /path="pricing"/);
  assert.match(routesSource, /path="features"/);
});
