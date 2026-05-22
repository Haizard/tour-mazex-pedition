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
  ["hotel-owner", "hotel-manager"].includes(String(value || "").trim())
    ? String(value).trim()
    : "hotel-owner";

const slugify = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeProposedHotelPayload = (body = {}, snapshots = {}) => {
  const name = toCleanString(body.name || snapshots.hotelNameSnapshot);
  if (!name) {
    throw new Error("Proposed hotel name is required.");
  }

  return {
    name,
    slug: slugify(body.slug || name),
    summary: toCleanString(body.summary),
    description: toCleanString(body.description),
    destination: toCleanString(body.destination || snapshots.destinationSnapshot),
    region: toCleanString(body.region),
    accommodationType: toCleanString(body.accommodationType || "hotel") || "hotel",
    amenities: toList(body.amenities),
    roomStyleSummary: toCleanString(body.roomStyleSummary),
    photos: toList(body.photos),
    trustSummary: toCleanString(body.trustSummary),
    sourceMeta: {
      claimOrigin: "hotel-self-registration",
    },
    published: false,
    marketplaceVisible: false,
    sponsoredPlacement: false,
    status: "draft",
  };
};

export const buildHotelClaimRequestPayload = async (body = {}, context = {}) => {
  const hotelId = body.hotelId ? String(body.hotelId).trim() : null;
  const claimType =
    body.claimType === "new-listing-request" ? "new-listing-request" : "existing-listing";
  const hotelNameSnapshot = toCleanString(body.hotelNameSnapshot);
  const destinationSnapshot = toCleanString(body.destinationSnapshot);
  const claimantName = toCleanString(body.claimantName);
  const claimantEmail = toLowerString(body.claimantEmail);
  const claimantPhone = toCleanString(body.claimantPhone);
  const requestedUsername = toLowerString(body.requestedUsername);
  const password = String(body.password || "");

  if (!claimantName) {
    throw new Error("Claimant name is required.");
  }

  if (!claimantEmail) {
    throw new Error("Claimant email is required.");
  }

  if (!requestedUsername) {
    throw new Error("Requested username is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  if (!hotelId && claimType !== "new-listing-request" && !body.proposedHotelPayload) {
    throw new Error("An existing hotel selection or proposed hotel details are required.");
  }

  const { passwordHash, passwordSalt } = await hashAdminPassword(password);
  const basePayload = {
    tenantId: context.tenantId || null,
    hotelId,
    hotelNameSnapshot,
    destinationSnapshot,
    claimantName,
    claimantEmail,
    claimantPhone,
    claimantRole: toRole(body.claimantRole),
    proofNote: toCleanString(body.proofNote),
    proofLinks: toList(body.proofLinks),
    claimType,
    status: "pending",
    requestedUsername,
    passwordHash,
    passwordSalt,
  };

  if (claimType === "new-listing-request" || !hotelId) {
    return {
      ...basePayload,
      hotelId: null,
      proposedHotelPayload: normalizeProposedHotelPayload(body.proposedHotelPayload || {}, {
        hotelNameSnapshot,
        destinationSnapshot,
      }),
    };
  }

  return basePayload;
};

export const buildHotelClaimReviewUpdate = (body = {}, context = {}) => {
  const action = String(body.action || "").trim().toLowerCase();
  const statusMap = {
    approve: "approved",
    reject: "rejected",
    "needs-more-proof": "needs-more-proof",
  };
  const status = statusMap[action] || "approved";

  return {
    status,
    reviewedBy: context.reviewerId || null,
    reviewedAt: new Date(),
    reviewNote: toCleanString(body.reviewNote),
  };
};

export const buildApprovedHotelPartnerAdminPayload = (claim = {}) => ({
  tenantId: claim.tenantId,
  hotelIds: [String(claim.hotelId || "")].filter(Boolean),
  username: toLowerString(claim.requestedUsername),
  displayName: toCleanString(claim.claimantName) || "Hotel Partner Admin",
  role: toRole(claim.claimantRole),
  status: "active",
  passwordHash: claim.passwordHash,
  passwordSalt: claim.passwordSalt,
});

export const shapeHotelClaimQueueItem = (claim = {}) => ({
  id: String(claim._id || claim.id || ""),
  tenantId: claim.tenantId ? String(claim.tenantId) : null,
  hotelId: claim.hotelId ? String(claim.hotelId) : null,
  hotelNameSnapshot: toCleanString(claim.hotelNameSnapshot),
  destinationSnapshot: toCleanString(claim.destinationSnapshot),
  claimantName: toCleanString(claim.claimantName),
  claimantEmail: toLowerString(claim.claimantEmail),
  claimantPhone: toCleanString(claim.claimantPhone),
  claimantRole: toRole(claim.claimantRole),
  proofNote: toCleanString(claim.proofNote),
  proofLinks: toList(claim.proofLinks),
  claimType: claim.claimType === "new-listing-request" ? "new-listing-request" : "existing-listing",
  status: claim.status || "pending",
  requestedUsername: toLowerString(claim.requestedUsername),
  reviewedBy: claim.reviewedBy ? String(claim.reviewedBy) : null,
  reviewedAt: claim.reviewedAt || null,
  reviewNote: toCleanString(claim.reviewNote),
  linkedPartnerAdminId: claim.linkedPartnerAdminId ? String(claim.linkedPartnerAdminId) : null,
  proposedHotelPayload: claim.proposedHotelPayload || undefined,
  createdAt: claim.createdAt || null,
  updatedAt: claim.updatedAt || null,
});
