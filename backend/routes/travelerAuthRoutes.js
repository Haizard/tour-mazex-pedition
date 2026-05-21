import express from "express";
import process from "node:process";
import {
  buildGoogleOAuthStartUrl,
  hasGoogleOAuthConfig,
} from "../utils/travelerGoogleAuth.js";

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

router.get("/google/callback", (_req, res) => {
  return res.status(501).json({
    code: "TRAVELER_GOOGLE_CALLBACK_PENDING",
    message:
      "Google callback handling will exchange the authorization code, create or link the traveler profile, and return the visitor to the marketplace.",
  });
});

export default router;
