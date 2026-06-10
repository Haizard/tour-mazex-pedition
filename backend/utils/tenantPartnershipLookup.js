import TenantPropertyPartnership from "../models/TenantPropertyPartnership.js";

/**
 * Look up the active partnership commission between a tenant and a property.
 *
 * @param {string} tenantId - The tourism tenant's ID (the distributor).
 * @param {string} propertyId - The hotel/restaurant MongoDB ObjectId.
 * @param {"hotel" | "restaurant"} propertyType
 * @returns {Promise<{ commissionPercent: number, partnershipId: string } | null>}
 */
export const lookupTenantPropertyCommission = async (
  tenantId = "",
  propertyId = "",
  propertyType = "hotel"
) => {
  if (!tenantId || !propertyId) {
    return null;
  }

  try {
    const partnership = await TenantPropertyPartnership.findOne({
      tenantId,
      propertyId,
      propertyType,
      status: "active",
    })
      .select("commissionPercent")
      .lean();

    if (!partnership) {
      return null;
    }

    return {
      commissionPercent: Number(partnership.commissionPercent || 0),
      partnershipId: String(partnership._id || ""),
    };
  } catch (error) {
    console.error(
      `[PartnershipLookup] Failed to look up ${propertyType} partnership for tenant ${tenantId}:`,
      error.message
    );
    return null;
  }
};

/**
 * Calculate the marketplace payout amount based on commission percent.
 *
 * @param {number} totalAmount - The full payment amount.
 * @param {number} commissionPercent - The commission percentage (0-100).
 * @returns {number} The commission/payout amount.
 */
export const calculateMarketplacePayout = (
  totalAmount = 0,
  commissionPercent = 0
) => {
  const amount = Number(totalAmount) || 0;
  const percent = Math.min(Math.max(Number(commissionPercent) || 0, 0), 100);
  return Number(((amount * percent) / 100).toFixed(2));
};

export default lookupTenantPropertyCommission;
