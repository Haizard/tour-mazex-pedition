const formatPickupDateTime = (value) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const summarizeAirportPickup = (pickup = {}) => {
  const guestName = pickup.guestName || "Guest";
  const airportCode = pickup.airportCode || "Airport";
  const pickupWindow = formatPickupDateTime(pickup.pickupDateTime);
  const driverName = pickup.driverName || "";

  if (pickup.status === "completed") {
    return {
      badgeLabel: "Completed",
      summary: `${guestName} was picked up at ${airportCode}${driverName ? ` by ${driverName}` : ""}.`,
    };
  }

  if (pickup.status === "scheduled") {
    return {
      badgeLabel: "Scheduled",
      summary: `${guestName} is scheduled for ${airportCode}${pickupWindow ? ` on ${pickupWindow}` : ""}${driverName ? ` with ${driverName}` : ""}.`,
    };
  }

  if (pickup.status === "cancelled") {
    return {
      badgeLabel: "Cancelled",
      summary: `${guestName}'s ${airportCode} airport transfer was cancelled and needs manual follow-up if travel is still active.`,
    };
  }

  return {
    badgeLabel: "Pending",
    summary: `${guestName} needs driver assignment and dispatch planning for ${airportCode}.`,
  };
};
