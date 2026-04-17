import mongoose from "mongoose";

const tenantThemeSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true,
      index: true,
    },
    primaryColor: { type: String, default: "#0d9488" },
    secondaryColor: { type: String, default: "#eab308" },
    accentColor: { type: String, default: "#f97316" },
    backgroundColor: { type: String, default: "#ffffff" },
    surfaceColor: { type: String, default: "#f8fafc" },
    textColor: { type: String, default: "#1e293b" },
    headingColor: { type: String, default: "#0f172a" },
    headingFont: { type: String, default: "'Playfair Display', serif" },
    bodyFont: { type: String, default: "'Montserrat', sans-serif" },
    borderRadius: { type: String, default: "1rem" },
    cardRadius: { type: String, default: "1.5rem" },
    buttonRadius: { type: String, default: "9999px" },
    shadowStyle: { type: String, default: "0 10px 30px rgba(15, 23, 42, 0.12)" },
    spacingScale: { type: String, default: "1" },
  },
  { timestamps: true }
);

const TenantTheme = mongoose.model("TenantTheme", tenantThemeSchema);
export default TenantTheme;
