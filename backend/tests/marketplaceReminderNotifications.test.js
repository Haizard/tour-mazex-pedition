import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMarketplaceReminderEvents,
  buildReminderWatchStateForTour,
  processSavedTripReminderList,
  sendMarketplaceReminderEmail,
} from "../utils/marketplaceReminderNotifications.js";
import SavedTripList from "../models/SavedTripList.js";

test("buildReminderWatchStateForTour captures the key availability digest", () => {
  const state = buildReminderWatchStateForTour({
    _id: "tour_1",
    marketplaceAvailability: [
      { date: "2026-07-18T00:00:00.000Z", status: "available", remainingSpots: 5 },
    ],
    marketplaceAvailabilitySettings: {
      instantBookingEnabled: true,
    },
  });

  assert.equal(state.tourId, "tour_1");
  assert.equal(state.hasPublishedDates, true);
  assert.equal(state.nextUpcomingDate, "2026-07-18T00:00:00.000Z");
  assert.match(state.digest, /published/);
});

test("buildMarketplaceReminderEvents returns new-date and unavailable events from watch-state changes", () => {
  const currentTours = [
    {
      _id: "tour_new",
      title: "Fresh Departure",
      marketplaceAvailability: [{ date: "2026-08-10T00:00:00.000Z", status: "available" }],
    },
    {
      _id: "tour_gone",
      title: "Gone Departure",
      marketplaceAvailability: [],
    },
  ];

  const events = buildMarketplaceReminderEvents({
    savedTripList: {
      reminders: {
        enabled: true,
        notifyForNewDates: true,
        notifyForUnavailableDates: true,
        watchStates: [
          {
            tourId: "tour_new",
            hasPublishedDates: false,
            nextUpcomingDate: null,
            digest: "hidden||0|",
          },
          {
            tourId: "tour_gone",
            hasPublishedDates: true,
            nextUpcomingDate: "2026-06-01T00:00:00.000Z",
            digest: "published|2026-06-01T00:00:00.000Z|1|",
          },
        ],
      },
    },
    tours: currentTours,
  });

  assert.equal(events.length, 2);
  assert.equal(events[0].type, "new-dates");
  assert.equal(events[1].type, "dates-unavailable");
});

test("sendMarketplaceReminderEmail skips cleanly when provider credentials are missing", async () => {
  const result = await sendMarketplaceReminderEmail({
    to: "traveler@example.com",
    events: [{ type: "watch-started", tour: { _id: "tour_1", title: "Safari" }, nextState: {} }],
    env: {},
  });

  assert.equal(result.delivered, false);
  assert.equal(result.skipped, true);
});

test("processSavedTripReminderList sends updates and persists next watch states", async () => {
  const writes = [];
  const originalUpdateOne = SavedTripList.updateOne;
  SavedTripList.updateOne = async (_query, update) => {
    writes.push(update);
    return { acknowledged: true };
  };

  try {
    const result = await processSavedTripReminderList({
      savedTripList: {
        _id: "saved_1",
        reminders: {
          enabled: true,
          email: "traveler@example.com",
          notifyForNewDates: true,
          notifyForUnavailableDates: true,
          watchStates: [
            {
              tourId: "tour_1",
              hasPublishedDates: false,
              nextUpcomingDate: null,
              digest: "hidden||0|",
            },
          ],
        },
      },
      tours: [
        {
          _id: "tour_1",
          title: "River Trail",
          marketplaceAvailability: [{ date: "2026-09-02T00:00:00.000Z", status: "available" }],
        },
      ],
      sendReminderEmail: async () => ({ delivered: true, skipped: false }),
    });

    assert.equal(result.sent, true);
    assert.equal(result.events.length, 1);
    assert.equal(writes.length, 1);
    assert.equal(Array.isArray(writes[0].$set["reminders.watchStates"]), true);
  } finally {
    SavedTripList.updateOne = originalUpdateOne;
  }
});
