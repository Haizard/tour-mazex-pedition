import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  TRAVELER_PROFILE_KEY,
  clearTravelerSession,
  getTravelerDisplayName,
  getTravelerInitials,
  persistTravelerSession,
  readStoredTravelerSession,
} from "./travelerAuthSession.js";
import { TRAVELER_AUTH_TOKEN_KEY } from "./travelerGooglePromptState.js";

const createStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));

  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
};

test("traveler session storage persists token and normalized profile", () => {
  const storage = createStorage();

  persistTravelerSession(
    {
      token: "token_1",
      traveler: {
        email: "Traveler@Example.com",
        displayName: "Asha Traveler",
        avatarUrl: "https://example.com/avatar.png",
      },
    },
    storage
  );

  assert.deepEqual(readStoredTravelerSession(storage), {
    token: "token_1",
    traveler: {
      email: "traveler@example.com",
      displayName: "Asha Traveler",
      avatarUrl: "https://example.com/avatar.png",
      authProvider: "",
      id: "",
    },
  });
});

test("traveler session storage clears corrupt profile without dropping token", () => {
  const storage = createStorage({
    [TRAVELER_AUTH_TOKEN_KEY]: "token_1",
    [TRAVELER_PROFILE_KEY]: "{bad-json",
  });

  assert.deepEqual(readStoredTravelerSession(storage), {
    token: "token_1",
    traveler: null,
  });
});

test("traveler session helpers derive compact names for navigation", () => {
  assert.equal(getTravelerDisplayName({ displayName: "Asha Traveler" }), "Asha Traveler");
  assert.equal(getTravelerDisplayName({ email: "traveler@example.com" }), "traveler");
  assert.equal(getTravelerInitials({ displayName: "Asha Traveler" }), "AT");
  assert.equal(getTravelerInitials({ email: "traveler@example.com" }), "T");
});

test("clearTravelerSession removes both token and stored profile", () => {
  const storage = createStorage({
    [TRAVELER_AUTH_TOKEN_KEY]: "token_1",
    [TRAVELER_PROFILE_KEY]: JSON.stringify({ email: "traveler@example.com" }),
  });

  clearTravelerSession(storage);

  assert.deepEqual(readStoredTravelerSession(storage), {
    token: "",
    traveler: null,
  });
});

test("API service exposes traveler session fetch with traveler auth headers", async () => {
  const source = await readFile(new URL("../../services/api.js", import.meta.url), "utf8");

  assert.equal(source.includes("getTravelerHeaders"), true);
  assert.equal(source.includes('url.includes("/traveler-auth")'), true);
  assert.equal(source.includes("fetchTravelerSession"), true);
});
