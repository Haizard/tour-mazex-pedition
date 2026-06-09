import express from "express";
import process from "node:process";
import {
  buildTravelerGoogleCallbackHtml,
  buildGoogleOAuthStartUrl,
  decodeGoogleOAuthState,
  exchangeGoogleCodeForProfile,
  hasGoogleOAuthConfig,
} from "../utils/travelerGoogleAuth.js";
import {
  signTravelerAuthToken,
  verifyTravelerAuthToken,
} from "../utils/travelerAuthTokens.js";
import { mergeTravelerAccountContinuity } from "../utils/travelerAccountContinuity.js";
import TravelerIdentity from "../models/TravelerIdentity.js";
import RestaurantReservationRequest from "../models/RestaurantReservationRequest.js";
import Restaurant from "../models/Restaurant.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { shapeReservationRequest } from "../utils/restaurantReservations.js";

const router = express.Router();

router.get("/google", (req, res) => {
  if (!hasGoogleOAuthConfig(process.env)) {
    return res.status(503).json({
      code: "GOOGLE_OAUTH_NOT_CONFIGURED",
      message:
        "Google traveler sign-in is ready in the UI, but GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI must be configured before redirecting visitors.",
    });
  }

  return res.redirect(
    buildGoogleOAuthStartUrl(
      {
        returnTo: req.query.returnTo || "/",
        sessionKey: req.query.sessionKey || "",
      },
      process.env
    )
  );
});

const findOrCreateGoogleTravelerIdentity = async ({ profile, sessionKey }) => {
  const match = {
    $or: [
      { googleSubject: profile.googleSubject },
      { email: profile.email },
      ...(sessionKey ? [{ sessionKey }] : []),
    ],
  };

  return TravelerIdentity.findOneAndUpdate(
    match,
    {
      $set: {
        sessionKey,
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        googleSubject: profile.googleSubject,
        authProvider: "google",
        lastLoginAt: new Date(),
      },
      $setOnInsert: {
        verificationState: "guest",
        linkedInquiryIds: [],
        linkedBookingIds: [],
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const handleTravelerGoogleCallback = async (req, res) => {
  try {
    if (req.query.error) {
      return res.redirect(
        `/?travelerAuth=cancelled&reason=${encodeURIComponent(String(req.query.error))}`
      );
    }

    const state = decodeGoogleOAuthState(req.query.state);
    const profile = await exchangeGoogleCodeForProfile({
      code: req.query.code,
      env: process.env,
    });
    const identity = await findOrCreateGoogleTravelerIdentity({
      profile,
      sessionKey: state.sessionKey,
    });
    await mergeTravelerAccountContinuity({
      identity,
      sessionKey: state.sessionKey,
      email: identity.email,
    });
    const token = signTravelerAuthToken({
      travelerIdentityId: String(identity._id),
      email: identity.email,
      sessionKey: identity.sessionKey,
    });

    return res
      .status(200)
      .type("html")
      .send(
        buildTravelerGoogleCallbackHtml({
          token,
          returnTo: state.returnTo,
          traveler: {
            id: String(identity._id),
            email: identity.email,
            displayName: identity.displayName,
            avatarUrl: identity.avatarUrl,
          },
        })
      );
  } catch (error) {
    return res.status(500).json({
      code: "TRAVELER_GOOGLE_CALLBACK_FAILED",
      message: error.message || "Google traveler sign-in failed.",
    });
  }
};

router.get("/google/callback", handleTravelerGoogleCallback);

router.get("/reservations", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    const payload = verifyTravelerAuthToken(token);
    const identity = await TravelerIdentity.findById(payload.travelerIdentityId).lean();

    if (!identity) {
      return res.status(404).json({ message: "Traveler account not found." });
    }

    const travelerEmail = identity.email;
    if (!travelerEmail) {
      return res.status(200).json({ reservations: [] });
    }

    const reservations = await RestaurantReservationRequest.find({
      travelerEmail,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Fetch restaurant names and active payment statuses in parallel
    const restaurantIds = [...new Set(reservations.map((r) => String(r.restaurantId)))];
    const reservationIds = reservations.map((r) => r._id);

    const [restaurants, activePayments] = await Promise.all([
      Restaurant.find({ _id: { $in: restaurantIds } })
        .select("_id name slug destination")
        .lean(),
      PaymentTransaction.find({
        restaurantReservationRequestId: { $in: reservationIds },
      })
        .select("amount currency status publicToken notes restaurantReservationRequestId")
        .lean(),
    ]);

    const restaurantMap = {};
    for (const r of restaurants) {
      restaurantMap[String(r._id)] = r;
    }

    const paymentMap = {};
    for (const p of activePayments) {
      const rid = String(p.restaurantReservationRequestId);
      if (!paymentMap[rid] || (p.status === "pending" && paymentMap[rid].status !== "pending")) {
        paymentMap[rid] = p;
      }
    }

    const enriched = reservations.map((reservation) => {
      const restaurantId = String(reservation.restaurantId);
      const rest = restaurantMap[restaurantId] || null;
      const payment = paymentMap[String(reservation._id)] || null;

      return {
        ...shapeReservationRequest(reservation),
        restaurant: rest
          ? {
              id: String(rest._id),
              name: rest.name,
              slug: rest.slug,
              destination: rest.destination,
            }
          : null,
        payment: payment
          ? {
              id: String(payment._id),
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
              publicToken: payment.publicToken,
              checkoutUrl: `/payment/${payment.publicToken}`,
              notes: payment.notes,
            }
          : null,
        checkoutUrl: payment?.publicToken
          ? `/payment/${payment.publicToken}`
          : null,
      };
    });

    return res.status(200).json({ reservations: enriched });
  } catch (_error) {
    return res.status(401).json({ message: "Invalid traveler session." });
  }
});

router.get("/me", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    const payload = verifyTravelerAuthToken(token);
    const identity = await TravelerIdentity.findById(payload.travelerIdentityId).lean();

    if (!identity) {
      return res.status(404).json({ message: "Traveler account was not found." });
    }

    return res.status(200).json({
      traveler: {
        id: String(identity._id),
        email: identity.email,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        authProvider: identity.authProvider,
      },
    });
  } catch (_error) {
    return res.status(401).json({ message: "Invalid traveler session." });
  }
});

export default router;
