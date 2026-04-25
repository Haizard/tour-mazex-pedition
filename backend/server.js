import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
// Explicitly set DNS servers to Google's to bypass local DNS issues with SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import cors from "cors";
import express from "express";
import { tenantMiddleware } from "./middleware/tenantMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import contactMessageRoutes from "./routes/contactMessageRoutes.js";
import customInquiryRoutes from "./routes/customInquiryRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import guideDriverRoutes from "./routes/guideDriverRoutes.js";
import accommodationRoutes from "./routes/accommodationRoutes.js";
import airportPickupRoutes from "./routes/airportPickupRoutes.js";
import partnerPortalRoutes from "./routes/partnerPortalRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dynamicPricingRoutes from "./routes/dynamicPricingRoutes.js";
import competitorIntelligenceRoutes from "./routes/competitorIntelligenceRoutes.js";
import languageAssistantRoutes from "./routes/languageAssistantRoutes.js";
import travelDocumentationRoutes from "./routes/travelDocumentationRoutes.js";
import homeContentRoutes from "./routes/homeContentRoutes.js";
import marketingRoutes from "./routes/marketingRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import pageConfigRoutes from "./routes/pageConfigRoutes.js";
import platformAdminRoutes from "./routes/platformAdminRoutes.js";
import platformAuthRoutes from "./routes/platformAuthRoutes.js";
import seoRoutes from "./routes/seoRoutes.js";
import siteSettingsRoutes from "./routes/siteSettingsRoutes.js";
import socialAccountRoutes from "./routes/socialAccountRoutes.js";
import socialPostRoutes from "./routes/socialPostRoutes.js";
import taxonomyRoutes from "./routes/taxonomyRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import tourRoutes from "./routes/tourRoutes.js";
import visionaryRoutes from "./routes/visionaryRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import {
  applySecurityHeaders,
  attachRequestMetadata,
  buildAllowedOrigins,
  createRateLimit,
  isAllowedOrigin,
} from "./middleware/securityMiddleware.js";
import {
  connectDB,
  getDatabaseHealth,
  registerMongooseListeners,
} from "./utils/database.js";

const app = express();
const PORT = process.env.PORT || 5000;
const isVercelRuntime = Boolean(process.env.VERCEL);
const allowedOrigins = buildAllowedOrigins();
const tenantAuthRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many tenant login attempts. Please try again shortly.",
  keyGenerator: (req) => `${req.ip || "unknown"}:tenant-auth:${req.tenantId || "unknown"}`,
});
const platformAuthRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many platform login attempts. Please try again shortly.",
  keyGenerator: (req) => `${req.ip || "unknown"}:platform-auth`,
});
const apiWriteRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  message: "Too many write requests. Please slow down and try again shortly.",
  keyGenerator: (req) =>
    `${req.ip || "unknown"}:${req.headers["x-tenant-slug"] || req.tenantId || "global"}:write-api`,
});

const databaseRequired = (req) =>
  req.path.startsWith("/api") ||
  req.path === "/robots.txt" ||
  req.path === "/sitemap.xml";

app.set("trust proxy", 1);
app.disable("x-powered-by");
registerMongooseListeners();
app.use(applySecurityHeaders);
app.use(attachRequestMetadata);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed."));
    },
    credentials: true,
  })
);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/ready", (_req, res) => {
  getDatabaseHealth()
    .then((health) => {
      const isReady = health.connected && health.pingOk && health.legacyFoundationReady;

      res.status(isReady ? 200 : 503).json({
        status: isReady ? "ready" : "degraded",
        mongoReadyState: health.readyState,
        mongoPingOk: health.pingOk,
        legacyFoundationReady: health.legacyFoundationReady,
        errorMessage: health.errorMessage || "",
      });
    })
    .catch((error) => {
      res.status(503).json({
        status: "degraded",
        mongoReadyState: 0,
        mongoPingOk: false,
        legacyFoundationReady: false,
        errorMessage: error.message,
      });
    });
});

app.use(async (req, res, next) => {
  if (!databaseRequired(req)) {
    next();
    return;
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database unavailable for request:", error.message);
    res.status(503).json({
      code: "DATABASE_UNAVAILABLE",
      message: "Database connection is temporarily unavailable. Please retry shortly.",
    });
  }
});

app.use(tenantMiddleware);
app.use("/api", (req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }

  if (req.path.startsWith("/auth") || req.path.startsWith("/platform-auth")) {
    next();
    return;
  }

  apiWriteRateLimit(req, res, next);
});
app.use("/api/auth", tenantAuthRateLimit, authRoutes);
app.use("/api/platform-auth", platformAuthRateLimit, platformAuthRoutes);
app.use("/api/platform-admin", platformAdminRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/page-config", pageConfigRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/guide-drivers", guideDriverRoutes);
app.use("/api/accommodations", accommodationRoutes);
app.use("/api/airport-pickups", airportPickupRoutes);
app.use("/api/partners", partnerPortalRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dynamic-pricing", dynamicPricingRoutes);
app.use("/api/competitor-intelligence", competitorIntelligenceRoutes);
app.use("/api/language-assistants", languageAssistantRoutes);
app.use("/api/travel-docs", travelDocumentationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/custom-inquiries", customInquiryRoutes);
app.use("/api/taxonomies", taxonomyRoutes);
app.use("/api/visionaries", visionaryRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/contact-messages", contactMessageRoutes);
app.use("/api/menu-items", menuRoutes);
app.use("/api/home-content", homeContentRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/site-settings", siteSettingsRoutes);
app.use("/api/social-accounts", socialAccountRoutes);
app.use("/api/social-posts", socialPostRoutes);
app.use("/api/media", mediaRoutes);

app.use("/", seoRoutes);

app.get("/", (_req, res) => {
  res.send("Tourism API is running...");
});

app.use((error, req, res, _next) => {
  console.error(`[Unhandled Error][${req.requestId || "unknown"}]`, error);

  if (res.headersSent) {
    return;
  }

  res.status(error.status || 500).json({
    message: "Something went wrong on the server.",
    requestId: req.requestId || "",
  });
});

if (!isVercelRuntime) {
  connectDB().catch((error) => {
    console.error("Initial MongoDB connection failed:", error.message);
  });

  app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
  });
}

export default app;
