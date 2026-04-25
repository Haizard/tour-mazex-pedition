import mongoose from "mongoose";

const airportPickupSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuideDriver",
      default: null,
    },
    guestName: {
      type: String,
      trim: true,
      default: "",
    },
    airportCode: {
      type: String,
      trim: true,
      required: true,
    },
    flightNumber: {
      type: String,
      trim: true,
      default: "",
    },
    pickupDateTime: {
      type: Date,
      default: null,
    },
    destinationLabel: {
      type: String,
      trim: true,
      default: "",
    },
    assignedTourTitle: {
      type: String,
      trim: true,
      default: "",
    },
    driverName: {
      type: String,
      trim: true,
      default: "",
    },
    vehicleLabel: {
      type: String,
      trim: true,
      default: "",
    },
    guestCount: {
      type: Number,
      min: 1,
      default: 1,
    },
    status: {
      type: String,
      enum: ["pending", "scheduled", "completed", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const AirportPickup =
  mongoose.models.AirportPickup ||
  mongoose.model("AirportPickup", airportPickupSchema);

export default AirportPickup;
