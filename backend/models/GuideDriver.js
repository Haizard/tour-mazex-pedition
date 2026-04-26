import mongoose from "mongoose";

const guideDriverSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
      required: true,
    },
    staffType: {
      type: String,
      enum: ["guide", "driver"],
      required: true,
      default: "guide",
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    homeBase: { type: String, default: "", trim: true },
    availabilityStatus: {
      type: String,
      enum: ["available", "assigned", "off-duty"],
      default: "available",
      index: true,
    },
    languages: { type: [String], default: [] },
    specialties: { type: [String], default: [] },
    assignedBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    assignedTourTitle: { type: String, default: "", trim: true },
    assignmentDate: { type: Date, default: null },
    assignmentStartDate: { type: Date, default: null },
    assignmentEndDate: { type: Date, default: null },
    assignmentNotes: { type: String, default: "", trim: true },
    licenseCategory: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const GuideDriver =
  mongoose.models.GuideDriver ||
  mongoose.model("GuideDriver", guideDriverSchema);

export default GuideDriver;
