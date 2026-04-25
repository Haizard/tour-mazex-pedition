import mongoose from "mongoose";

const competitorInsightSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    competitorName: {
      type: String,
      required: true,
      trim: true,
    },
    marketRegion: {
      type: String,
      trim: true,
      default: "",
    },
    focusRoute: {
      type: String,
      trim: true,
      default: "",
    },
    observedPriceUsd: {
      type: Number,
      min: 0,
      default: null,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "USD",
    },
    marketTrend: {
      type: String,
      trim: true,
      default: "",
    },
    offerSummary: {
      type: String,
      trim: true,
      default: "",
    },
    sourceLabel: {
      type: String,
      trim: true,
      default: "",
    },
    intelligenceDate: {
      type: Date,
      default: null,
    },
    strengthSignals: {
      type: [String],
      default: [],
    },
    riskSignals: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["watchlist", "active", "archived"],
      default: "watchlist",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const CompetitorInsight =
  mongoose.models.CompetitorInsight ||
  mongoose.model("CompetitorInsight", competitorInsightSchema);

export default CompetitorInsight;
