import mongoose from "mongoose";

const savedTripListSchema = new mongoose.Schema(
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
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const SavedTripList =
  mongoose.models.SavedTripList ||
  mongoose.model("SavedTripList", savedTripListSchema);

export default SavedTripList;

