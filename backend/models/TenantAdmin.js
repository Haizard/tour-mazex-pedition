import mongoose from "mongoose";

const tenantAdminSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      default: "Tenant Admin",
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    passwordSalt: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "editor"],
      default: "owner",
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

tenantAdminSchema.index({ tenantId: 1, username: 1 }, { unique: true });

const TenantAdmin = mongoose.model("TenantAdmin", tenantAdminSchema);
export default TenantAdmin;
