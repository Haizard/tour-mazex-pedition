import mongoose from "mongoose";

const platformAdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    displayName: {
      type: String,
      default: "Platform Admin",
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
      enum: ["super_admin", "support_admin", "observer"],
      default: "super_admin",
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

const PlatformAdmin = mongoose.model("PlatformAdmin", platformAdminSchema);
export default PlatformAdmin;
