const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const summarizeAccommodationReservation = (reservation = {}) => {
  const hotelName = reservation.hotelName || "Unassigned property";
  const checkIn = formatDate(reservation.checkInDate);
  const checkOut = formatDate(reservation.checkOutDate);

  if (reservation.status === "confirmed") {
    const stayWindow =
      checkIn && checkOut ? ` from ${checkIn} to ${checkOut}` : checkIn ? ` starting ${checkIn}` : "";
    return {
      badgeLabel: "Confirmed",
      summary: `${hotelName} is confirmed${stayWindow}.`,
    };
  }

  if (reservation.status === "cancelled") {
    return {
      badgeLabel: "Cancelled",
      summary: `${hotelName} reservation was cancelled and needs a replacement plan if guests still need lodging.`,
    };
  }

  return {
    badgeLabel: "Pending",
    summary: `Awaiting supplier confirmation for ${hotelName}.`,
  };
};
