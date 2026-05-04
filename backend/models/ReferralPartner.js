import mongoose from "mongoose";

const referralPartnerSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  partnerCode: { type: String, required: true, unique: true }, // e.g., 'INFLUENCER_10'
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  commissionPercent: { type: Number, default: 10 },
  totalReferrals: { type: Number, default: 0 },
  totalRevenueGenerated: { type: Number, default: 0 },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

// Index for fast lookup by code and tenant
referralPartnerSchema.index({ tenantId: 1, partnerCode: 1 });

const ReferralPartner = mongoose.model("ReferralPartner", referralPartnerSchema);
export default ReferralPartner;
