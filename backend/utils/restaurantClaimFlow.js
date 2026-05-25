import { hashAdminPassword } from "./adminAuth.js";

const toCleanString = (value = "") => String(value || "").trim();
const toLowerString = (value = "") => toCleanString(value).toLowerCase();

const toList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => toCleanString(item)).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toRole = (value = "") =>
  ["restaurant-owner", "restaurant-manager"].includes(String(value || "").trim())
    ? String(value).trim()
    : "restaurant-owner";

const slugify = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeProposedRestaurantPayload = (body = {}, snapshots = {}) => {
  const name = toCleanString(body.name || snapshots.restaurantNameSnapshot);
  if (!name) {
    throw new Error("Proposed restaurant name is required.");
  }

  return {
    name,
    slug: slugify(body.slug || name),
    summary: toCleanString(body.summary),
    description: toCleanString(body.description),
    destination: toCleanString(body.destination || snapshots.destinationSnapshot),
    region: toCleanString(body.region || snapshots.regionSnapshot),
    cuisineTypes: toList(body.cuisineTypes || body.cuisineType),
    mealTypes: toList(body.mealTypes),
    dietaryFits: toList(body.dietaryFits),
    ambianceTags: toList(body.ambianceTags),
    openingHoursSummary: toCleanString(body.openingHoursSummary),
    reservationStyleSummary: toCleanString(body.reservationStyleSummary),
    photos: toList(body.photos),
    trustSummary: toCleanString(body.trustSummary),
    sourceMeta: {
      claimOrigin: "restaurant-self-claim",
    },
    published: false,
    marketplaceVisible: false,
    sponsoredPlacement: false,
    status: "draft",
  };
};

export const buildRestaurantClaimRequestPayload = async (body = {}, context = {}) => {
  const restaurantId = body.restaurantId ? String(body.restaurantId).trim() : null;
  const claimType =
    body.claimType === "new-listing-request" ? "new-listing-request" : "existing-listing";
  const restaurantNameSnapshot = toCleanString(body.restaurantNameSnapshot);
  const destinationSnapshot = toCleanString(body.destinationSnapshot);
  const regionSnapshot = toCleanString(body.regionSnapshot);
  const claimantName = toCleanString(body.claimantName);
  const claimantEmail = toLowerString(body.claimantEmail);
  const requestedUsername = toLowerString(body.requestedUsername) || claimantEmail;
  const password = String(body.password || "");

  if (!claimantName) {
    throw new Error("Claimant name is required.");
  }

  if (!claimantEmail) {
    throw new Error("Claimant email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  if (!restaurantId && claimType !== "new-listing-request" && !body.proposedRestaurantPayload) {
    throw new Error("An existing restaurant selection or proposed restaurant details are required.");
  }

  const { passwordHash, passwordSalt } = await hashAdminPassword(password);

  const basePayload = {
    tenantId: context.tenantId || null,
    restaurantId,
    restaurantNameSnapshot,
    destinationSnapshot,
    regionSnapshot,
    claimantName,
    claimantEmail,
    claimantPhone: toCleanString(body.claimantPhone),
    claimantRole: toRole(body.claimantRole),
    proofNote: toCleanString(body.proofNote),
    proofLinks: toList(body.proofLinks),
    claimType,
    status: "pending",
    requestedUsername,
    passwordHash,
    passwordSalt,
  };

  if (claimType === "new-listing-request" || !restaurantId) {
    return {
      ...basePayload,
      restaurantId: null,
      proposedRestaurantPayload: normalizeProposedRestaurantPayload(
        body.proposedRestaurantPayload || {},
        {
          restaurantNameSnapshot,
          destinationSnapshot,
          regionSnapshot,
        }
      ),
    };
  }

  return basePayload;
};

export const buildRestaurantClaimReviewUpdate = (body = {}, context = {}) => {
  const action = String(body.action || "").trim().toLowerCase();
  const statusMap = {
    approve: "approved",
    reject: "rejected",
    "needs-more-proof": "needs-more-proof",
  };

  return {
    status: statusMap[action] || "approved",
    reviewedBy: context.reviewerId || null,
    reviewedAt: new Date(),
    reviewNote: toCleanString(body.reviewNote),
  };
};

export const buildApprovedRestaurantPartnerAdminPayload = (claim = {}) => {
  if (!claim.passwordHash || !claim.passwordSalt) {
    throw new Error(
      "Restaurant claim is missing password credentials. A password is required before approval."
    );
  }

  return {
    tenantId: claim.tenantId,
    restaurantIds: [String(claim.restaurantId || "")].filter(Boolean),
    username: toLowerString(claim.requestedUsername) || toLowerString(claim.claimantEmail),
    displayName: toCleanString(claim.claimantName) || "Restaurant Partner Admin",
    role: toRole(claim.claimantRole),
    status: "active",
    passwordHash: claim.passwordHash,
    passwordSalt: claim.passwordSalt,
  };
};

export const shapeRestaurantClaimQueueItem = (claim = {}) => ({
  id: String(claim._id || claim.id || ""),
  tenantId: claim.tenantId ? String(claim.tenantId) : null,
  restaurantId: claim.restaurantId ? String(claim.restaurantId) : null,
  restaurantNameSnapshot: toCleanString(claim.restaurantNameSnapshot),
  destinationSnapshot: toCleanString(claim.destinationSnapshot),
  regionSnapshot: toCleanString(claim.regionSnapshot),
  claimantName: toCleanString(claim.claimantName),
  claimantEmail: toLowerString(claim.claimantEmail),
  claimantPhone: toCleanString(claim.claimantPhone),
  claimantRole: toRole(claim.claimantRole),
  proofNote: toCleanString(claim.proofNote),
  proofLinks: toList(claim.proofLinks),
  claimType: claim.claimType === "new-listing-request" ? "new-listing-request" : "existing-listing",
  status: claim.status || "pending",
  requestedUsername: toLowerString(claim.requestedUsername) || toLowerString(claim.claimantEmail),
  reviewedBy: claim.reviewedBy ? String(claim.reviewedBy) : null,
  reviewedAt: claim.reviewedAt || null,
  reviewNote: toCleanString(claim.reviewNote),
  linkedPartnerAdminId: claim.linkedPartnerAdminId ? String(claim.linkedPartnerAdminId) : null,
  proposedRestaurantPayload: claim.proposedRestaurantPayload || undefined,
  createdAt: claim.createdAt || null,
  updatedAt: claim.updatedAt || null,
});
