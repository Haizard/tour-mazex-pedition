import mongoose from "mongoose";

const tripComparisonSetSchema = new mongoose.Schema(
  {
    travelerIdentityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelerIdentity",
      default: null,
      index: true,
    },
    sessionKey: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    selectedTourIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "TourPackage" }],
  },
  { timestamps: true }
);

const TripComparisonSet =
  mongoose.models.TripComparisonSet ||
  mongoose.model("TripComparisonSet", tripComparisonSetSchema);

export default TripComparisonSet;

