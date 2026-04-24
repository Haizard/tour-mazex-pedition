import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
// Explicitly set DNS servers to Google's to bypass local DNS issues with SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import cors from "cors";
import express from "express";
import mongoose from "mongoose";
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
  buildAllowedOrigins,
  createRateLimit,
  isAllowedOrigin,
} from "./middleware/securityMiddleware.js";
import { ensureLegacyTenantFoundation } from "./utils/tenantBootstrap.js";

const app = express();
const PORT = process.env.PORT || 5000;
const isVercelRuntime = Boolean(process.env.VERCEL);
const allowedOrigins = buildAllowedOrigins();
let mongoConnectionPromise = null;
let legacyFoundationPromise = null;
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

const ensureLegacyFoundationReady = async () => {
  if (!legacyFoundationPromise) {
    legacyFoundationPromise = ensureLegacyTenantFoundation()
      .then(() => {
        console.log("Legacy tenant foundation ready");
      })
      .catch((error) => {
        legacyFoundationPromise = null;
        throw error;
      });
  }

  return legacyFoundationPromise;
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    await ensureLegacyFoundationReady();
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose
      .connect(mongoUri, {
        maxPoolSize: isVercelRuntime ? 3 : 10,
        minPoolSize: 0,
        maxIdleTimeMS: 10000,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      })
      .then(async (connection) => {
        console.log("Connected to MongoDB");
        await ensureLegacyFoundationReady();
        return connection;
      })
      .catch((error) => {
        mongoConnectionPromise = null;
        legacyFoundationPromise = null;
        console.error("MongoDB connection error:", error.message);
        throw error;
      });
  }

  return mongoConnectionPromise;
};

const databaseRequired = (req) =>
  req.path.startsWith("/api") ||
  req.path === "/robots.txt" ||
  req.path === "/sitemap.xml";

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(applySecurityHeaders);
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
  const isReady = mongoose.connection.readyState === 1;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ready" : "degraded",
    mongoReadyState: mongoose.connection.readyState,
    legacyFoundationReady: Boolean(legacyFoundationPromise),
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
app.use("/api/auth", tenantAuthRateLimit, authRoutes);
app.use("/api/platform-auth", platformAuthRateLimit, platformAuthRoutes);
app.use("/api/platform-admin", platformAdminRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/page-config", pageConfigRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/gallery", galleryRoutes);
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

if (!isVercelRuntime) {
  connectDB().catch((error) => {
    console.error("Initial MongoDB connection failed:", error.message);
  });

  app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
  });
}

export default app;
