import mongoose from "mongoose";
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const hotelRoomInventorySchema = new mongoose.Schema(
  {
    roomTypeCode: { type: String, trim: true, required: true },
    label: { type: String, trim: true, required: true },
    capacity: { type: Number, min: 1, default: 2 },
    totalUnits: { type: Number, min: 0, default: 0 },
    baseNightlyRate: { type: Number, min: 0, default: null },
    currency: { type: String, trim: true, uppercase: true, default: "USD" },
    boardBasis: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const hotelAvailabilityEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    roomTypeCode: { type: String, trim: true, required: true },
    status: {
      type: String,
      enum: ["open", "limited", "sold-out", "on-request", "closed"],
      default: "open",
    },
    availableUnits: { type: Number, min: 0, default: 0 },
    nightlyRate: { type: Number, min: 0, default: null },
    currency: { type: String, trim: true, uppercase: true, default: "" },
    minStay: { type: Number, min: 1, default: 1 },
    note: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const hotelInventorySettingsSchema = new mongoose.Schema(
  {
    autoExtendCalendar: { type: Boolean, default: false },
    monthsAhead: { type: Number, min: 1, max: 24, default: 3 },
    defaultCurrency: { type: String, trim: true, uppercase: true, default: "USD" },
    defaultStatus: {
      type: String,
      enum: ["open", "limited", "sold-out", "on-request", "closed"],
      default: "open",
    },
    checkInCutoffDays: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const hotelCheckoutSettingsSchema = new mongoose.Schema(
  {
    currency: { type: String, trim: true, uppercase: true, default: "USD" },
    taxPercent: { type: Number, min: 0, default: 0 },
    serviceFeePercent: { type: Number, min: 0, default: 0 },
    cleaningFee: { type: Number, min: 0, default: 0 },
    depositPercent: { type: Number, min: 0, max: 100, default: 100 },
    allowPayNow: { type: Boolean, default: true },
    instantBookable: { type: Boolean, default: false },
    cancellationPolicy: { type: String, trim: true, default: "" },
    checkInTime: { type: String, trim: true, default: "" },
    checkOutTime: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const hotelChannelConnectionSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["manual", "siteminder", "cloudbeds", "little-hotelier", "booking-com"],
      default: "manual",
    },
    status: {
      type: String,
      enum: ["draft", "connected", "paused", "error"],
      default: "draft",
    },
    externalHotelId: { type: String, trim: true, default: "" },
    syncMode: {
      type: String,
      enum: ["pull", "push", "bidirectional"],
      default: "pull",
    },
    syncInventory: { type: Boolean, default: true },
    syncRates: { type: Boolean, default: true },
    syncRestrictions: { type: Boolean, default: false },
    credentialSummary: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
    lastSyncAt: { type: Date, default: null },
    lastSyncStatus: {
      type: String,
      enum: ["idle", "success", "warning", "failed"],
      default: "idle",
    },
    lastSyncMessage: { type: String, trim: true, default: "" },
    lastSyncDirection: {
      type: String,
      enum: ["pull", "push", "bidirectional", ""],
      default: "",
    },
    lastSyncSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { _id: false }
);

const hotelSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
      required: true,
    },
    partnerAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerAccount",
      default: null,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    summary: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    destination: { type: String, trim: true, default: "" },
    region: { type: String, trim: true, default: "" },
    geo: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    accommodationType: { type: String, trim: true, default: "hotel" },
    amenities: { type: [String], default: [] },
    roomStyleSummary: { type: String, trim: true, default: "" },
    roomInventory: { type: [hotelRoomInventorySchema], default: [] },
    availabilityCalendar: { type: [hotelAvailabilityEntrySchema], default: [] },
    inventorySettings: {
      type: hotelInventorySettingsSchema,
      default: () => ({
        autoExtendCalendar: false,
        monthsAhead: 3,
        defaultCurrency: "USD",
        defaultStatus: "open",
        checkInCutoffDays: 0,
      }),
    },
    checkoutSettings: {
      type: hotelCheckoutSettingsSchema,
      default: () => ({
        currency: "USD",
        taxPercent: 0,
        serviceFeePercent: 0,
        cleaningFee: 0,
        depositPercent: 100,
        allowPayNow: true,
        instantBookable: false,
        cancellationPolicy: "",
        checkInTime: "",
        checkOutTime: "",
      }),
    },
    channelConnections: { type: [hotelChannelConnectionSchema], default: [] },
    photos: { type: [String], default: [] },
    averageRating: { type: Number, min: 0, max: 5, default: null },
    reviewCount: { type: Number, min: 0, default: 0 },
    trustSummary: { type: String, trim: true, default: "" },
    published: { type: Boolean, default: false },
    marketplaceVisible: { type: Boolean, default: false },
    sponsoredPlacement: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
    },
    sourceMeta: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    pendingPartnerUpdate: {
      status: {
        type: String,
        enum: ["none", "pending-review", "approved", "rejected"],
        default: "none",
      },
      payload: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({}),
      },
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HotelPartnerAdmin",
        default: null,
      },
      submittedAt: {
        type: Date,
        default: null,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TenantAdmin",
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      reviewNote: {
        type: String,
        trim: true,
        default: "",
      },
    },
    businessTruth: {
      type: new mongoose.Schema(
        createBusinessTruthMetadataSchemaDefinition({ entityKey: "hotels" }),
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

hotelSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
hotelSchema.index({ marketplaceVisible: 1, published: 1, destination: 1 });

const Hotel = mongoose.models.Hotel || mongoose.model("Hotel", hotelSchema);

export default Hotel;
