import test from "node:test";
import assert from "node:assert/strict";

import { isPlatformHostname } from "./api.js";

test("isPlatformHostname treats Vercel deployment hosts as platform hosts", () => {
  assert.equal(isPlatformHostname("tour-mazex-pedition-git-main-haizard.vercel.app"), true);
});

test("isPlatformHostname does not treat the legacy tenant Vercel host as platform", () => {
  assert.equal(isPlatformHostname("tourism-website-inky.vercel.app"), false);
});
