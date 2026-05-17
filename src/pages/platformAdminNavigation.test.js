import test from "node:test";
import assert from "node:assert/strict";

import { platformPrimarySections } from "./platformAdminNavigation.js";

test("platform primary navigation exposes Template Studio outside tenant workspace", () => {
  assert.ok(
    platformPrimarySections.some(
      (section) => section.id === "template-studio" && section.label === "Template Studio",
    ),
  );
});
