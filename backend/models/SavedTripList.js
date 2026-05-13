import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    email: { type: String, trim: true, lowercase: true, default: "" },
    watchedTourIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "TourPackage" }],
    notifyForNewDates: { type: Boolean, default: true },
    notifyForUnavailableDates: { type: Boolean, default: true },
    lastRequestedAt: { type: Date, default: null },
    lastConfirmationSentAt: { type: Date, default: null },
    watchStates: {
      type: [
        new mongoose.Schema(
          {
            tourId: { type: mongoose.Schema.Types.ObjectId, ref: "TourPackage", required: true },
            digest: { type: String, default: "" },
            hasPublishedDates: { type: Boolean, default: false },
            nextUpcomingDate: { type: Date, default: null },
            upcomingDatesCount: { type: Number, default: 0 },
            lastNotifiedAt: { type: Date, default: null },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { _id: false }
);

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
    reminders: {
      type: reminderSchema,
      default: () => ({
        enabled: false,
        email: "",
        watchedTourIds: [],
        notifyForNewDates: true,
        notifyForUnavailableDates: true,
        lastRequestedAt: null,
        lastConfirmationSentAt: null,
        watchStates: [],
      }),
    },
  },
  { timestamps: true }
);

const SavedTripList =
  mongoose.models.SavedTripList ||
  mongoose.model("SavedTripList", savedTripListSchema);

export default SavedTripList;
