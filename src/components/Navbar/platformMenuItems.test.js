import test from "node:test";
import assert from "node:assert/strict";

import { PLATFORM_MENU_ITEMS } from "./platformMenuItems.js";

test("platform menu links to the tourism templates page", () => {
  assert.ok(
    PLATFORM_MENU_ITEMS.some((item) => item.label === "Templates" && item.link === "/templates"),
  );
});

test("platform menu exposes the hotel marketplace", () => {
  assert.ok(
    PLATFORM_MENU_ITEMS.some((item) => item.label === "Hotels" && item.link === "/discover/hotels"),
  );
});
