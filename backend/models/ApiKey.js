import mongoose from "mongoose";
import crypto from "node:crypto";

const apiKeySchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    keyHash: { type: String, required: true },
    keyPrefix: { type: String, required: true }, // first 8 chars for display
    label: { type: String, default: "Default Key" },
    scopes: {
      type: [String],
      default: ["tours:read", "inquiries:write"],
      enum: ["tours:read", "inquiries:read", "inquiries:write", "full:read"],
    },
    active: { type: Boolean, default: true, index: true },
    lastUsedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Static: generate a new raw key + its hash for storage
apiKeySchema.statics.generateKey = function () {
  const raw = `mzx_${crypto.randomBytes(28).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(raw).digest("hex");
  const keyPrefix = raw.substring(0, 12);
  return { raw, keyHash, keyPrefix };
};

// Static: find a key by its raw value
apiKeySchema.statics.findByRawKey = async function (rawKey) {
  if (!rawKey || typeof rawKey !== "string") return null;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  return this.findOne({ keyHash, active: true });
};

export default mongoose.model("ApiKey", apiKeySchema);
