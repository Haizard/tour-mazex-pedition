import mongoose from "mongoose";

const marketplacePartnershipSchema = new mongoose.Schema({
  providerTenantId: { type: String, required: true, index: true }, // The operator who owns the tours
  distributorTenantId: { type: String, required: true, index: true }, // The operator selling the tours
  status: { 
    type: String, 
    enum: ["requested", "active", "suspended", "declined"], 
    default: "requested" 
  },
  commissionPercent: { type: Number, default: 15 },
  allowedTourIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "TourPackage" }], // Specific tours shared
  sharedAt: { type: Date },
  lastSyncAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Composite index for unique partnership tracking
marketplacePartnershipSchema.index({ providerTenantId: 1, distributorTenantId: 1 }, { unique: true });

const MarketplacePartnership = mongoose.model("MarketplacePartnership", marketplacePartnershipSchema);
export default MarketplacePartnership;
