import test from "node:test";
import assert from "node:assert/strict";

import { resolveCanonicalUrl } from "./seo.js";

const originalWindow = global.window;

test.after(() => {
  if (originalWindow === undefined) {
    delete global.window;
    return;
  }

  global.window = originalWindow;
});

test("resolveCanonicalUrl keeps demo tenant paths scoped on public tenant pages", () => {
  global.window = {
    location: {
      origin: "https://mazexpeditions.vercel.app",
      pathname: "/demo/mazepro/blogs",
    },
  };

  assert.equal(
    resolveCanonicalUrl("/blogs/serengeti-national-park"),
    "https://mazexpeditions.vercel.app/demo/mazepro/blogs/serengeti-national-park",
  );
});

test("resolveCanonicalUrl uses the live tenant origin on custom domains", () => {
  global.window = {
    location: {
      origin: "https://www.operator-example.com",
      pathname: "/blogs",
    },
  };

  assert.equal(
    resolveCanonicalUrl("/blogs/serengeti-national-park"),
    "https://www.operator-example.com/blogs/serengeti-national-park",
  );
});

test("resolveCanonicalUrl preserves explicit absolute canonicals", () => {
  assert.equal(
    resolveCanonicalUrl("https://stories.example.com/feature"),
    "https://stories.example.com/feature",
  );
});
