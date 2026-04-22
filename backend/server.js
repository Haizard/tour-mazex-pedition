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
import { ensureLegacyTenantFoundation } from "./utils/tenantBootstrap.js";

const app = express();
const PORT = process.env.PORT || 5000;
const isVercelRuntime = Boolean(process.env.VERCEL);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mazexpeditions.com",
      "https://tourism-website-inky.vercel.app",
      "https://mazexpeditions.vercel.app",
    ],
    credentials: true,
  })
);

app.use(tenantMiddleware);
app.use("/api/auth", authRoutes);
app.use("/api/platform-auth", platformAuthRoutes);
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

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MONGODB_URI is not defined in environment variables");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
    await ensureLegacyTenantFoundation();
    console.log("Legacy tenant foundation ready");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
};

connectDB();

if (!isVercelRuntime) {
  app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
  });
}

export default app;
