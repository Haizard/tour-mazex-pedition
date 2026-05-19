import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  events: [{ type: String, required: true }],
  accommodation: { type: String }
});

const marketplaceAvailabilitySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["available", "limited", "unavailable", "on-request"],
    default: "available",
  },
  published: { type: Boolean, default: true },
  remainingSpots: { type: Number, default: null },
  note: { type: String, default: "" },
}, { _id: false });

const marketplaceAvailabilitySettingsSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ["manual", "weekly-template"],
    default: "manual",
  },
  autoGenerateFutureDates: { type: Boolean, default: false },
  weeklyDepartureDays: {
    type: [Number],
    default: [],
  },
  monthsAhead: { type: Number, default: 3 },
  bookingCutoffDays: { type: Number, default: 0 },
  defaultRemainingSpots: { type: Number, default: null },
  defaultGeneratedStatus: {
    type: String,
    enum: ["available", "limited", "unavailable", "on-request"],
    default: "available",
  },
  generatedNote: { type: String, default: "" },
  instantBookingEnabled: { type: Boolean, default: false },
  inventoryRefreshMode: {
    type: String,
    enum: ["operator-managed", "rule-generated"],
    default: "operator-managed",
  },
}, { _id: false });

const tourPackageSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    index: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }, // Numeric price for search/filters
  image: { type: String, required: true }, // Image URL
  galleryImages: [{ type: String }],
  location: { type: String, required: true },
  startLocation: { type: String },
  endLocation: { type: String },
  destinationsVisited: [{ type: String }],
  author: { type: String, default: "Admin" },
  date: { type: String }, // For text-based price/pax info (e.g., "$1659PP")
  itinerary: [itinerarySchema],
  inclusions: [{ type: String }],
  exclusions: [{ type: String }],
  faqs: [{ question: { type: String }, answer: { type: String } }],
  pricingTable: {
    greenSeason: { type: String },
    highSeason: { type: String },
    peakSeason: { type: String }
  },
  duration: { type: String },
  maxGroupSize: { type: Number },
  tourType: { type: String }, // e.g., Safari, Trekking
  category: { type: String }, // e.g., Luxury, Budget
  destinationSlug: { type: String, trim: true, default: "" },
  accommodationType: { type: String }, // e.g., Lodge, Camp, Budget Camp
  tripAdvisorUrl: { type: String },
  tripAdvisorRating: { type: Number },
  tripAdvisorReviewCount: { type: Number },
  featured: { type: Boolean, default: false },
  isPubliclyDistributable: { type: Boolean, default: true },
  isMarketplaceVisible: { type: Boolean, default: false },
  allowMarketplaceReviews: { type: Boolean, default: true },
  allowTravelerPhotos: { type: Boolean, default: true },
  allowMarketplaceQuestions: { type: Boolean, default: true },
  marketplaceAvailability: { type: [marketplaceAvailabilitySchema], default: [] },
  marketplaceAvailabilitySettings: {
    type: marketplaceAvailabilitySettingsSchema,
    default: () => ({
      mode: "manual",
      autoGenerateFutureDates: false,
      weeklyDepartureDays: [],
      monthsAhead: 3,
      bookingCutoffDays: 0,
      defaultRemainingSpots: null,
      defaultGeneratedStatus: "available",
      generatedNote: "",
      instantBookingEnabled: false,
      inventoryRefreshMode: "operator-managed",
    }),
  },
  // Group Tour Fields
  isGroupTour: { type: Boolean, default: false },
  maxCapacity: { type: Number, default: 0 },
  currentBookings: { type: Number, default: 0 },
  launchDate: { type: Date },
  seo: {
    title: { type: String },
    description: { type: String },
    keywords: [{ type: String }],
    ogImage: { type: String },
    canonicalUrl: { type: String },
    schema: { type: String }
  },
}, { timestamps: true });

const TourPackage = mongoose.model('TourPackage', tourPackageSchema);
export default TourPackage;
