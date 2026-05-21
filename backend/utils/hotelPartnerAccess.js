const toId = (value) => {
  if (!value) {
    return "";
  }

  return String(value._id || value);
};

const toList = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const canHotelPartnerManageHotel = (partnerAdmin = {}, hotel = {}) => {
  const tenantId = toId(partnerAdmin.tenantId);
  const hotelTenantId = toId(hotel.tenantId);
  const hotelId = toId(hotel._id);
  const assignedHotelIds = toList(partnerAdmin.hotelIds).map(toId);

  return Boolean(tenantId && hotelTenantId && tenantId === hotelTenantId && assignedHotelIds.includes(hotelId));
};

export const canHotelPartnerManageAccommodationRequest = (partnerAdmin = {}, reservation = {}) => {
  const tenantId = toId(partnerAdmin.tenantId);
  const reservationTenantId = toId(reservation.tenantId);
  const hotelId = toId(reservation.hotelId);
  const assignedHotelIds = toList(partnerAdmin.hotelIds).map(toId);

  return Boolean(
    tenantId &&
      reservationTenantId &&
      tenantId === reservationTenantId &&
      hotelId &&
      assignedHotelIds.includes(hotelId)
  );
};

export const buildHotelPartnerProfileUpdate = (body = {}) => {
  const allowedFields = [
    "name",
    "slug",
    "summary",
    "description",
    "destination",
    "region",
    "geo",
    "accommodationType",
    "amenities",
    "roomStyleSummary",
    "photos",
    "trustSummary",
  ];

  return allowedFields.reduce((payload, field) => {
    if (typeof body[field] === "undefined") {
      return payload;
    }

    if (field === "amenities") {
      payload.amenities = toList(body.amenities);
      return payload;
    }

    if (field === "photos") {
      payload.photos = toList(body.photos);
      return payload;
    }

    payload[field] = body[field];
    return payload;
  }, {});
};

export const buildHotelPartnerAdminAccountPayload = (body = {}) => {
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!username) {
    throw new Error("Partner admin username is required.");
  }

  if (!password) {
    throw new Error("Partner admin password is required.");
  }

  return {
    username,
    password,
    displayName: String(body.displayName || "Hotel Partner Admin").trim(),
    role: ["hotel-owner", "hotel-manager"].includes(body.role) ? body.role : "hotel-owner",
    status: "active",
  };
};

export const buildHotelPartnerAccommodationResponseUpdate = (body = {}) => {
  const status = ["pending", "confirmed", "cancelled"].includes(body.status)
    ? body.status
    : "confirmed";

  return {
    status,
    reservationCode: String(body.reservationCode || "").trim(),
    notes: String(body.notes || "").trim(),
    lastSupplierMessageSharedAt: new Date().toISOString(),
  };
};
