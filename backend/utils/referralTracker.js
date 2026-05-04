import ReferralPartner from "../models/ReferralPartner.js";

/**
 * Validates a referral code and increment counters if valid.
 * [SKILL: Growth Infrastructure]
 */
export const trackReferralInteraction = async (tenantId, referralCode) => {
  if (!referralCode || !tenantId) return null;

  try {
    const partner = await ReferralPartner.findOne({ 
      tenantId, 
      partnerCode: referralCode.trim().toUpperCase(),
      status: "active"
    });

    if (partner) {
      // In a real production system, we would log this interaction in a separate 
      // 'ReferralInteraction' table for click-through analytics.
      return {
        partnerId: partner._id,
        partnerCode: partner.partnerCode,
        commissionPercent: partner.commissionPercent
      };
    }
    return null;
  } catch (error) {
    console.error("Referral tracking error:", error);
    return null;
  }
};

/**
 * Updates partner stats after a successful booking/payment.
 */
export const recordReferralConversion = async (tenantId, partnerCode, revenueAmount) => {
  if (!partnerCode || !tenantId) return;

  try {
    await ReferralPartner.updateOne(
      { tenantId, partnerCode: partnerCode.toUpperCase() },
      { 
        $inc: { 
          totalReferrals: 1,
          totalRevenueGenerated: Number(revenueAmount || 0)
        }
      }
    );
  } catch (error) {
    console.error("Referral conversion recording error:", error);
  }
};
