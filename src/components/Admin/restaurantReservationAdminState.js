const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  "needs-clarification": "Needs clarification",
  cancelled: "Cancelled",
};

export const getReservationStatusLabel = (status = "pending") =>
  STATUS_LABELS[status] || "Pending";

export const summarizeRestaurantReservationRequests = (requests = []) => {
  const summary = {
    total: requests.length,
    pending: 0,
    confirmed: 0,
    declined: 0,
    needsClarification: 0,
    cancelled: 0,
  };

  requests.forEach((request) => {
    if (request.status === "needs-clarification") {
      summary.needsClarification += 1;
    } else if (Object.prototype.hasOwnProperty.call(summary, request.status)) {
      summary[request.status] += 1;
    }
  });

  return summary;
};

export const getReservationAutopilotBadge = (autopilot = {}) => {
  const label = String(autopilot.classification || "reservation").replace(/-/g, " ");
  const formatted = label.charAt(0).toUpperCase() + label.slice(1);
  return autopilot.requiresHumanReview ? `${formatted} / review` : formatted;
};

export const shapeRestaurantReservationOperations = (operations = {}) => {
  const reservationRequests = operations.reservationRequests || [];

  return {
    serviceWindows: operations.serviceWindows || [],
    tableTypes: operations.tableTypes || [],
    availabilityEntries: operations.availabilityEntries || [],
    reservationRequests,
    summary: summarizeRestaurantReservationRequests(reservationRequests),
  };
};
