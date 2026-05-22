export const createHotelBookingInitialState = () => ({
  checkInDate: "",
  checkOutDate: "",
  roomTypeCode: "",
  units: 1,
  guestCount: 2,
  provider: "stripe",
  traveler: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  },
});

export const buildHotelBookingQuotePayload = (form = {}) => ({
  checkInDate: form.checkInDate || "",
  checkOutDate: form.checkOutDate || "",
  roomTypeCode: form.roomTypeCode || "",
  units: Number(form.units || 1),
  guestCount: Number(form.guestCount || 1),
});

export const buildHotelBookingReservationPayload = (form = {}) => ({
  ...buildHotelBookingQuotePayload(form),
  provider: form.provider || "stripe",
  traveler: {
    firstName: form.traveler?.firstName || "",
    lastName: form.traveler?.lastName || "",
    email: form.traveler?.email || "",
    phone: form.traveler?.phone || "",
  },
});
