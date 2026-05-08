export const resolveMarketplaceTravelerIdentity = async (input = {}, store = {}) => {
  const sessionKey = String(input.sessionKey || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const bookingId = String(input.bookingId || "").trim();
  const inquiryId = String(input.inquiryId || "").trim();

  const existing = await store.findOne?.({ sessionKey, email });
  const linkedBookingIds = [...new Set([...(existing?.linkedBookingIds || []), ...(bookingId ? [bookingId] : [])])];
  const linkedInquiryIds = [...new Set([...(existing?.linkedInquiryIds || []), ...(inquiryId ? [inquiryId] : [])])];

  const verificationState = bookingId
    ? "verified-booking"
    : inquiryId
      ? "verified-inquiry"
      : "guest";

  return store.create({
    ...(existing || {}),
    sessionKey,
    email,
    verificationState,
    linkedBookingIds,
    linkedInquiryIds,
  });
};
