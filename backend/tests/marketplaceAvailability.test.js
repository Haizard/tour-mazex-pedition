import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAvailabilitySummary,
  computeAvailabilityEntries,
  matchesAvailabilityFilter,
  matchesDepartureMonth,
} from "../utils/marketplaceAvailability.js";
import { buildInstantBookingIntent } from "../routes/marketplaceEngagementRoutes.js";

test("computeAvailabilityEntries merges manual and generated dates and marks instant-bookable departures", () => {
  const entries = computeAvailabilityEntries(
    {
      marketplaceAvailability: [
        { date: "2026-06-10T00:00:00.000Z", status: "limited", remainingSpots: 2, note: "Almost full" },
      ],
      marketplaceAvailabilitySettings: {
        mode: "weekly-template",
        autoGenerateFutureDates: true,
        weeklyDepartureDays: [1, 3],
        monthsAhead: 1,
        defaultRemainingSpots: 6,
        defaultGeneratedStatus: "available",
        instantBookingEnabled: true,
        bookingCutoffDays: 2,
      },
    },
    { referenceDate: "2026-06-01T00:00:00.000Z" }
  );

  assert.ok(entries.length >= 2);
  assert.equal(entries[0].status, "available");
  assert.equal(entries.some((entry) => entry.date.startsWith("2026-06-10") && entry.status === "limited"), true);
  assert.equal(entries.some((entry) => entry.instantBookable === true), true);
});

test("buildAvailabilitySummary exposes next bookable and request-only states", () => {
  const requestOnly = buildAvailabilitySummary(
    {
      marketplaceAvailability: [
        { date: "2026-06-12T00:00:00.000Z", status: "on-request" },
        { date: "2026-06-19T00:00:00.000Z", status: "on-request" },
      ],
    },
    { referenceDate: "2026-06-01T00:00:00.000Z" }
  );

  assert.equal(requestOnly.hasPublishedDates, true);
  assert.equal(requestOnly.upcomingDatesCount, 2);
  assert.equal(requestOnly.requestOnly, true);
  assert.equal(requestOnly.nextBookableDate, "2026-06-12T00:00:00.000Z");
});

test("availability filters and month matching use computed summary fields", () => {
  const summary = buildAvailabilitySummary(
    {
      marketplaceAvailability: [
        { date: "2026-07-05T00:00:00.000Z", status: "available", remainingSpots: 4 },
        { date: "2026-08-15T00:00:00.000Z", status: "unavailable", remainingSpots: 0 },
      ],
      marketplaceAvailabilitySettings: {
        instantBookingEnabled: true,
      },
    },
    { referenceDate: "2026-06-20T00:00:00.000Z" }
  );

  assert.equal(matchesAvailabilityFilter(summary, "upcoming"), true);
  assert.equal(matchesAvailabilityFilter(summary, "bookable"), true);
  assert.equal(matchesAvailabilityFilter(summary, "instant"), true);
  assert.equal(matchesDepartureMonth(summary, "2026-07"), true);
  assert.equal(matchesDepartureMonth(summary, "2026-09"), false);
});

test("buildInstantBookingIntent rejects non-instant dates and returns a short-lived intent for eligible ones", () => {
  const tour = {
    _id: "tour_1",
    marketplaceAvailability: [
      { date: "2026-06-12T00:00:00.000Z", status: "limited", remainingSpots: 2 },
    ],
    marketplaceAvailabilitySettings: {
      instantBookingEnabled: true,
      bookingCutoffDays: 1,
    },
  };

  const intent = buildInstantBookingIntent({
    tour,
    travelDate: "2026-06-12",
    travelers: 1,
  });

  assert.equal(intent.tourId, "tour_1");
  assert.equal(intent.instantBookable, true);
  assert.equal(intent.remainingSpots, 2);

  assert.throws(
    () =>
      buildInstantBookingIntent({
        tour: {
          ...tour,
          marketplaceAvailabilitySettings: {
            instantBookingEnabled: false,
          },
        },
        travelDate: "2026-06-12",
      }),
    /instant booking/i
  );
});
