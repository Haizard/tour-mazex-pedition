import mongoose from "mongoose";

const accommodationReservationSchema = new mongoose.Schema(
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
    bookingGuestName: {
      type: String,
      trim: true,
      default: "",
    },
    assignedTourTitle: {
      type: String,
      trim: true,
      default: "",
    },
    hotelName: {
      type: String,
      required: true,
      trim: true,
    },
    supplierName: {
      type: String,
      trim: true,
      default: "",
    },
    supplierContact: {
      type: String,
      trim: true,
      default: "",
    },
    destination: {
      type: String,
      trim: true,
      default: "",
    },
    reservationCode: {
      type: String,
      trim: true,
      default: "",
    },
    roomPlan: {
      type: String,
      trim: true,
      default: "",
    },
    checkInDate: {
      type: Date,
      default: null,
    },
    checkOutDate: {
      type: Date,
      default: null,
    },
    guestCount: {
      type: Number,
      min: 1,
      default: 1,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
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

const AccommodationReservation = mongoose.model(
  "AccommodationReservation",
  accommodationReservationSchema
);

export default AccommodationReservation;
