import SavedTripList from "../models/SavedTripList.js";
import TourPackage from "../models/TourPackage.js";
import { buildAvailabilitySummary } from "./marketplaceAvailability.js";

const REMINDER_PROVIDER_URL = "https://api.resend.com/emails";

const safeString = (value = "") => String(value || "").trim();

export const getMarketplaceReminderEmailConfig = (env = globalThis.process?.env || {}) => ({
  apiKey: safeString(env.RESEND_API_KEY || env.MARKETPLACE_REMINDER_RESEND_API_KEY),
  fromEmail: safeString(
    env.MARKETPLACE_REMINDER_FROM_EMAIL ||
      env.RESEND_FROM_EMAIL ||
      env.EMAIL_FROM
  ),
  replyTo: safeString(env.MARKETPLACE_REMINDER_REPLY_TO || env.REPLY_TO_EMAIL),
  appUrl: safeString(env.VITE_SITE_URL || env.APP_URL || env.PUBLIC_SITE_URL),
  cronSecret: safeString(env.MARKETPLACE_REMINDER_CRON_SECRET),
});

export const buildReminderWatchStateForTour = (tour = {}) => {
  const summary = buildAvailabilitySummary(tour);
  const digest = [
    summary.hasPublishedDates ? "published" : "hidden",
    safeString(summary.nextUpcomingDate),
    Number(summary.upcomingDatesCount || 0),
    safeString(summary.nextInstantBookableDate),
  ].join("|");

  return {
    tourId: String(tour._id || ""),
    digest,
    hasPublishedDates: summary.hasPublishedDates === true,
    nextUpcomingDate: summary.nextUpcomingDate || null,
    upcomingDatesCount: Number(summary.upcomingDatesCount || 0),
    availabilitySummary: summary,
  };
};

export const buildReminderWatchStatesForTours = (tours = []) =>
  (tours || []).map((tour) => buildReminderWatchStateForTour(tour));

export const buildMarketplaceReminderEvents = ({
  savedTripList = {},
  tours = [],
} = {}) => {
  const statesByTourId = new Map(
    (savedTripList.reminders?.watchStates || []).map((state) => [String(state.tourId || ""), state])
  );

  const events = [];

  for (const tour of tours) {
    const nextState = buildReminderWatchStateForTour(tour);
    const previous = statesByTourId.get(String(nextState.tourId || ""));
    const previousHadPublishedDates = previous?.hasPublishedDates === true;
    const nextHasPublishedDates = nextState.hasPublishedDates === true;
    const nextUpcomingDate = safeString(nextState.nextUpcomingDate);
    const previousUpcomingDate = safeString(previous?.nextUpcomingDate);

    if (
      savedTripList.reminders?.notifyForNewDates !== false &&
      nextHasPublishedDates &&
      (!previous || !previousHadPublishedDates || previousUpcomingDate !== nextUpcomingDate)
    ) {
      events.push({
        type: previous ? "new-dates" : "watch-started",
        tour,
        previous,
        nextState,
      });
      continue;
    }

    if (
      savedTripList.reminders?.notifyForUnavailableDates === true &&
      previousHadPublishedDates &&
      !nextHasPublishedDates
    ) {
      events.push({
        type: "dates-unavailable",
        tour,
        previous,
        nextState,
      });
    }
  }

  return events;
};

export const buildMarketplaceReminderEmail = ({
  to = "",
  events = [],
  appUrl = "",
} = {}) => {
  const firstTour = events[0]?.tour || {};
  const tourCount = events.length;
  const subject =
    tourCount > 1
      ? `${tourCount} marketplace trips have new availability updates`
      : events[0]?.type === "dates-unavailable"
        ? `${firstTour.title || "A saved trip"} no longer has published dates`
        : `${firstTour.title || "A saved trip"} has a new travel-date update`;

  const lines = events.map((event) => {
    const summary = event.nextState?.availabilitySummary || event.nextState || {};
    const nextDate = safeString(summary.nextUpcomingDate)
      ? new Date(summary.nextUpcomingDate).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "Dates currently on request";

    const prefix =
      event.type === "dates-unavailable"
        ? "Published dates are no longer visible"
        : event.type === "watch-started"
          ? "You are now watching this trip"
          : "New travel-date update";

    return {
      text: `${prefix}: ${event.tour.title} (${nextDate})`,
      html: `<li style="margin-bottom:12px;"><strong>${prefix}:</strong> ${event.tour.title} <span style="color:#5b6b60;">(${nextDate})</span></li>`,
      url: appUrl ? `${appUrl.replace(/\/$/, "")}/discover/tour/${event.tour._id}` : "",
    };
  });

  const text = [
    "Marketplace trip update",
    "",
    ...lines.map((line) => line.text),
    "",
    appUrl ? `Open the marketplace: ${appUrl.replace(/\/$/, "")}/discover` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin: 0 0 16px; color: #234232;">Marketplace trip update</h2>
      <p style="margin: 0 0 16px;">We noticed a change on one of the trips you asked us to watch.</p>
      <ul style="padding-left: 18px; margin: 0 0 20px;">
        ${lines.map((line) => line.html).join("")}
      </ul>
      ${
        appUrl
          ? `<p style="margin: 0;"><a href="${appUrl.replace(/\/$/, "")}/discover" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#234232;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Open marketplace</a></p>`
          : ""
      }
    </div>
  `;

  return {
    to,
    subject,
    text,
    html,
  };
};

export const sendMarketplaceReminderEmail = async ({
  to = "",
  events = [],
  env = globalThis.process?.env || {},
  sendRequest = async (url, init) => fetch(url, init),
} = {}) => {
  const config = getMarketplaceReminderEmailConfig(env);

  if (!config.apiKey || !config.fromEmail || !safeString(to) || !events.length) {
    return {
      delivered: false,
      skipped: true,
      reason: "Reminder delivery is not configured.",
    };
  }

  const payload = buildMarketplaceReminderEmail({
    to,
    events,
    appUrl: config.appUrl,
  });

  const response = await sendRequest(REMINDER_PROVIDER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      ...(config.replyTo ? { reply_to: config.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Reminder delivery failed: ${response.status} ${errorText}`);
  }

  return {
    delivered: true,
    skipped: false,
  };
};

export const processSavedTripReminderList = async ({
  savedTripList,
  tours,
  env = globalThis.process?.env || {},
  now = new Date(),
  sendReminderEmail = sendMarketplaceReminderEmail,
} = {}) => {
  if (!savedTripList?.reminders?.enabled || !savedTripList?.reminders?.email) {
    return { sent: false, skipped: true, reason: "Reminders are not enabled." };
  }

  const events = buildMarketplaceReminderEvents({ savedTripList, tours });
  const nextWatchStates = buildReminderWatchStatesForTours(tours).map((state) => ({
    tourId: state.tourId,
    digest: state.digest,
    hasPublishedDates: state.hasPublishedDates,
    nextUpcomingDate: state.nextUpcomingDate,
    upcomingDatesCount: state.upcomingDatesCount,
    lastNotifiedAt: events.find((event) => String(event.tour._id || "") === String(state.tourId))
      ? now
      : null,
  }));

  if (!events.length) {
    await SavedTripList.updateOne(
      { _id: savedTripList._id },
      {
        $set: {
          "reminders.watchStates": nextWatchStates,
        },
      }
    );
    return { sent: false, skipped: true, reason: "No reminder events to deliver." };
  }

  const delivery = await sendReminderEmail({
    to: savedTripList.reminders.email,
    events,
    env,
  });

  if (delivery.delivered) {
    await SavedTripList.updateOne(
      { _id: savedTripList._id },
      {
        $set: {
          "reminders.watchStates": nextWatchStates,
        },
      }
    );
  }

  return {
    sent: delivery.delivered === true,
    skipped: delivery.skipped === true,
    events: events.map((event) => ({
      type: event.type,
      tourId: String(event.tour._id || ""),
      title: event.tour.title || "",
    })),
  };
};

export const processMarketplaceReminderNotificationsNow = async ({
  env = globalThis.process?.env || {},
  limit = 25,
  loadSavedTripLists = async () =>
    SavedTripList.find({
      "reminders.enabled": true,
      "reminders.email": { $exists: true, $ne: "" },
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean(),
  loadToursForList = async (savedTripList) =>
    TourPackage.find({
      _id: { $in: savedTripList.reminders?.watchedTourIds || [] },
      isMarketplaceVisible: true,
    })
      .populate("tenantId", "name slug")
      .lean(),
  sendReminderEmail = sendMarketplaceReminderEmail,
} = {}) => {
  const savedTripLists = await loadSavedTripLists();
  const summary = {
    attempted: 0,
    delivered: 0,
    skipped: 0,
    failed: 0,
  };

  for (const savedTripList of savedTripLists) {
    summary.attempted += 1;
    try {
      const tours = await loadToursForList(savedTripList);
      const result = await processSavedTripReminderList({
        savedTripList,
        tours,
        env,
        sendReminderEmail,
      });

      if (result.sent) {
        summary.delivered += 1;
      } else {
        summary.skipped += 1;
      }
    } catch (error) {
      summary.failed += 1;
      console.error("Marketplace reminder processing failed:", error.message);
    }
  }

  return summary;
};

let marketplaceReminderLoopHandle = null;

export const startMarketplaceReminderProcessingLoop = ({
  env = globalThis.process?.env || {},
  intervalMs = 1000 * 60 * 30,
} = {}) => {
  if (marketplaceReminderLoopHandle) {
    return marketplaceReminderLoopHandle;
  }

  marketplaceReminderLoopHandle = setInterval(() => {
    processMarketplaceReminderNotificationsNow({ env }).catch((error) => {
      console.error("Marketplace reminder loop error:", error.message);
    });
  }, intervalMs);

  return marketplaceReminderLoopHandle;
};

export const stopMarketplaceReminderProcessingLoop = () => {
  if (!marketplaceReminderLoopHandle) {
    return;
  }

  clearInterval(marketplaceReminderLoopHandle);
  marketplaceReminderLoopHandle = null;
};
