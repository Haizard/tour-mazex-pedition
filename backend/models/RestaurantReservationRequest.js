import mongoose from "mongoose";

const restaurantReservationRequestSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    serviceWindowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantServiceWindow",
      default: null,
    },
    tableTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantTableType",
      default: null,
    },
    travelerName: { type: String, required: true, trim: true },
    travelerEmail: { type: String, required: true, trim: true, lowercase: true },
    travelerPhone: { type: String, trim: true, default: "" },
    date: { type: String, required: true, trim: true, index: true },
    preferredTime: { type: String, required: true, trim: true },
    guestCount: { type: Number, min: 1, required: true },
    seatingPreference: { type: String, trim: true, default: "" },
    dietaryNotes: { type: String, trim: true, default: "" },
    occasion: { type: String, trim: true, default: "" },
    source: {
      type: String,
      enum: ["direct", "itinerary", "operator-assisted"],
      default: "direct",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined", "needs-clarification", "cancelled"],
      default: "pending",
      index: true,
    },
    publicNotes: { type: String, trim: true, default: "" },
    partnerNotes: { type: String, trim: true, default: "" },
    linkedInquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomInquiry",
      default: null,
    },
    linkedQuoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuoteProposal",
      default: null,
    },
    itineraryContext: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    autopilot: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

restaurantReservationRequestSchema.index({ tenantId: 1, restaurantId: 1, status: 1 });
restaurantReservationRequestSchema.index({ tenantId: 1, restaurantId: 1, date: 1 });

const RestaurantReservationRequest =
  mongoose.models.RestaurantReservationRequest ||
  mongoose.model("RestaurantReservationRequest", restaurantReservationRequestSchema);

export default RestaurantReservationRequest;
