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

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const DRIVER_CONFLICT_WINDOW_MINUTES = 180;

export const hasAirportPickupTimingConflict = (left = {}, right = {}) => {
  const leftDate = toDate(left.pickupDateTime);
  const rightDate = toDate(right.pickupDateTime);

  if (!leftDate || !rightDate) {
    return false;
  }

  const diffMinutes = Math.abs(leftDate.getTime() - rightDate.getTime()) / (1000 * 60);
  return diffMinutes < DRIVER_CONFLICT_WINDOW_MINUTES;
};

export const summarizeAirportPickup = (pickup = {}) => {
  const guestName = pickup.guestName || "Guest";
  const airportCode = pickup.airportCode || "Airport";
  const pickupWindow = formatPickupDateTime(pickup.pickupDateTime);
  const driverName = pickup.driverName || "";
  const conflictCount = Array.isArray(pickup.conflicts) ? pickup.conflicts.length : 0;
  const conflictSuffix =
    conflictCount > 0 ? ` Attention: ${conflictCount} dispatch conflict${conflictCount > 1 ? "s" : ""} detected.` : "";

  if (pickup.status === "completed") {
    return {
      badgeLabel: "Completed",
      summary: `${guestName} was picked up at ${airportCode}${driverName ? ` by ${driverName}` : ""}.${conflictSuffix}`,
    };
  }

  if (pickup.status === "scheduled") {
    return {
      badgeLabel: "Scheduled",
      summary: `${guestName} is scheduled for ${airportCode}${pickupWindow ? ` on ${pickupWindow}` : ""}${driverName ? ` with ${driverName}` : ""}.${conflictSuffix}`,
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

export const buildAirportPickupConflictMap = (pickups = [], drivers = []) => {
  const activePickups = (pickups || []).filter((pickup) => pickup.status !== "cancelled");
  const conflictMap = new Map();
  const driverMap = new Map((drivers || []).map((driver) => [String(driver._id), driver]));

  activePickups.forEach((pickup) => {
    conflictMap.set(String(pickup._id), []);
  });

  activePickups.forEach((pickup) => {
    const pickupId = String(pickup._id);
    const conflicts = conflictMap.get(pickupId) || [];
    const driver = pickup.driverId ? driverMap.get(String(pickup.driverId)) : null;

    if (pickup.driverId && driver?.availabilityStatus === "off-duty") {
      conflicts.push({
        type: "driver-off-duty",
        summary: `${driver.fullName || pickup.driverName || "Assigned driver"} is marked off duty.`,
      });
    }

    if (
      pickup.driverId &&
      driver?.assignmentStartDate &&
      pickup.pickupDateTime
    ) {
      const pickupDate = toDate(pickup.pickupDateTime);
      const assignmentStart = toDate(driver.assignmentStartDate || driver.assignmentDate);
      const assignmentEnd = toDate(driver.assignmentEndDate || driver.assignmentStartDate || driver.assignmentDate);
      const sameBooking = String(driver.assignedBookingId || "") === String(pickup.bookingId || "");

      if (
        pickupDate &&
        assignmentStart &&
        assignmentEnd &&
        !sameBooking &&
        pickupDate >= assignmentStart &&
        pickupDate <= assignmentEnd
      ) {
        conflicts.push({
          type: "driver-booking-assignment",
          summary: `${driver.fullName || pickup.driverName || "Assigned driver"} is already assigned to another safari during this pickup window.`,
        });
      }
    }

    conflictMap.set(pickupId, conflicts);
  });

  for (let index = 0; index < activePickups.length; index += 1) {
    const current = activePickups[index];
    const currentId = String(current._id);

    for (let compareIndex = index + 1; compareIndex < activePickups.length; compareIndex += 1) {
      const candidate = activePickups[compareIndex];
      const candidateId = String(candidate._id);

      if (
        !current.driverId ||
        !candidate.driverId ||
        String(current.driverId) !== String(candidate.driverId)
      ) {
        continue;
      }

      if (!hasAirportPickupTimingConflict(current, candidate)) {
        continue;
      }

      const currentConflicts = conflictMap.get(currentId) || [];
      const candidateConflicts = conflictMap.get(candidateId) || [];
      const summary = `${current.driverName || candidate.driverName || "Driver"} has another airport transfer scheduled too close to this pickup.`;

      currentConflicts.push({
        type: "driver-double-booked",
        relatedPickupId: candidateId,
        summary,
      });
      candidateConflicts.push({
        type: "driver-double-booked",
        relatedPickupId: currentId,
        summary,
      });

      conflictMap.set(currentId, currentConflicts);
      conflictMap.set(candidateId, candidateConflicts);
    }
  }

  return conflictMap;
};

export const buildAirportPickupDispatchNote = (pickup = {}) => {
  const guestName = pickup.guestName || "guest";
  const airportCode = pickup.airportCode || "airport";
  const pickupWindow = formatPickupDateTime(pickup.pickupDateTime);
  const destination = pickup.destinationLabel || "the destination";
  const flightNumber = pickup.flightNumber ? `Flight ${pickup.flightNumber}.` : "";
  const guestCount = pickup.guestCount ? `Guests: ${pickup.guestCount}.` : "";
  const notes = pickup.notes ? `Notes: ${pickup.notes}` : "";

  return `Dispatch brief: collect ${guestName} from ${airportCode}${pickupWindow ? ` on ${pickupWindow}` : ""} and transfer them to ${destination}. ${flightNumber} ${guestCount} ${notes}`.replace(/\s+/g, " ").trim();
};

export const enrichAirportPickups = (pickups = [], drivers = []) => {
  const conflictMap = buildAirportPickupConflictMap(pickups, drivers);

  return (pickups || []).map((pickup) => {
    const conflicts = conflictMap.get(String(pickup._id)) || [];
    const enrichedPickup = {
      ...pickup,
      conflicts,
      conflictCount: conflicts.length,
      dispatchBrief: buildAirportPickupDispatchNote(pickup),
    };

    return {
      ...enrichedPickup,
      coordinationSummary: summarizeAirportPickup(enrichedPickup),
    };
  });
};

export const buildAirportPickupDashboard = (bookings = [], pickups = []) =>
  (bookings || [])
    .filter((booking) => ["Confirmed", "Completed"].includes(booking.status))
    .map((booking) => {
      const linkedPickups = (pickups || []).filter(
        (pickup) => String(pickup.bookingId || "") === String(booking._id)
      );
      const activePickups = linkedPickups.filter((pickup) => pickup.status !== "cancelled");
      const assignedPickups = activePickups.filter((pickup) => pickup.driverId);

      return {
        bookingId: booking._id,
        travelerName: booking.name,
        packageTour: booking.packageTour,
        travelDate: booking.travelDate,
        pickups: linkedPickups,
        needsPickup: activePickups.length === 0,
        unassignedCount: activePickups.filter((pickup) => !pickup.driverId).length,
        hasConflict: linkedPickups.some((pickup) => (pickup.conflictCount || 0) > 0),
        assignedDrivers: assignedPickups.map((pickup) => pickup.driverName).filter(Boolean),
      };
    })
    .sort((left, right) => new Date(left.travelDate || 0).getTime() - new Date(right.travelDate || 0).getTime());

export const buildAirportArrivalTimeline = (pickups = []) =>
  (pickups || [])
    .filter((pickup) => pickup.status !== "cancelled")
    .map((pickup) => ({
      pickupId: String(pickup._id),
      guestName: pickup.guestName || "Guest",
      airportCode: pickup.airportCode || "",
      pickupDateTime: pickup.pickupDateTime || null,
      status: pickup.status || "pending",
      driverName: pickup.driverName || "",
    }))
    .sort(
      (left, right) =>
        new Date(left.pickupDateTime || 0).getTime() - new Date(right.pickupDateTime || 0).getTime()
    );
