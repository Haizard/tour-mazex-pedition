import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHotelChannelSyncResult,
  normalizeHotelChannelConnections,
} from "../utils/hotelChannels.js";

test("normalizeHotelChannelConnections keeps supported providers only", () => {
  const rows = normalizeHotelChannelConnections([
    { provider: "cloudbeds", status: "connected", syncMode: "push" },
    { provider: "unknown-provider" },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].provider, "cloudbeds");
  assert.equal(rows[0].syncMode, "push");
});

test("buildHotelChannelSyncResult summarizes sync payload", () => {
  const result = buildHotelChannelSyncResult({
    hotel: {
      name: "Serengeti Camp",
      roomInventory: [{ roomTypeCode: "suite" }],
      availabilityCalendar: [{ date: "2026-07-12", roomTypeCode: "suite" }],
    },
    provider: "manual",
    direction: "pull",
  });

  assert.equal(result.lastSyncStatus, "success");
  assert.equal(result.lastSyncDirection, "pull");
  assert.equal(result.lastSyncSnapshot.roomTypeCount, 1);
  assert.equal(result.lastSyncSnapshot.availabilityEntryCount, 1);
});
