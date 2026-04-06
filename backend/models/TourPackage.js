import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  events: [{ type: String, required: true }],
  accommodation: { type: String }
});

const tourPackageSchema = new mongoose.Schema({
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
  accommodationType: { type: String }, // e.g., Lodge, Camp, Budget Camp
  tripAdvisorUrl: { type: String },
  tripAdvisorRating: { type: Number },
  tripAdvisorReviewCount: { type: Number },
  featured: { type: Boolean, default: false },
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
