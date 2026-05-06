import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["email", "whatsapp", "phone", "website", "social"],
      required: true,
    },
    value: {
      type: String,
      trim: true,
      required: true,
    },
    confidence: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const tourismLeadCandidateSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    organizationName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
      required: true,
    },
    officialWebsiteUrl: {
      type: String,
      trim: true,
      default: "",
    },
    sourcePolicy: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    allowedContacts: {
      type: [contactSchema],
      default: [],
    },
    blockedContacts: {
      type: [contactSchema],
      default: [],
    },
    categories: {
      type: [String],
      default: [],
      index: true,
    },
    complianceFlags: {
      type: [String],
      default: [],
    },
    leadScore: {
      type: Number,
      default: 0,
      index: true,
    },
    leadTemperature: {
      type: String,
      enum: ["hot", "warm", "cold"],
      default: "cold",
      index: true,
    },
    leadScoreReasons: {
      type: [String],
      default: [],
    },
    recommendedUseCases: {
      type: [String],
      default: [],
      index: true,
    },
    outreachAllowed: {
      type: Boolean,
      default: false,
      index: true,
    },
    outreachStatus: {
      type: String,
      enum: ["new", "reviewing", "approved", "contacted", "rejected", "opted-out"],
      default: "new",
      index: true,
    },
    sourceExcerpt: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedBy: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    operatorNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

tourismLeadCandidateSchema.index({ tenantId: 1, sourceUrl: 1 }, { unique: true });
tourismLeadCandidateSchema.index({ tenantId: 1, leadTemperature: 1, outreachStatus: 1 });

const TourismLeadCandidate =
  mongoose.models.TourismLeadCandidate ||
  mongoose.model("TourismLeadCandidate", tourismLeadCandidateSchema);

export default TourismLeadCandidate;
