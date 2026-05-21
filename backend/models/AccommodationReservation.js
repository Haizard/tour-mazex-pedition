import mongoose from "mongoose";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

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
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      default: null,
      index: true,
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
    lastSupplierMessageSharedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    businessTruth: {
      type: new mongoose.Schema(
        createBusinessTruthMetadataSchemaDefinition({ entityKey: "accommodation-reservations" }),
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const AccommodationReservation = mongoose.model(
  "AccommodationReservation",
  accommodationReservationSchema
);

export default AccommodationReservation;
