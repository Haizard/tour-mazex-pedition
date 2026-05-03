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

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeHotelName = (value = "") => value.trim().toLowerCase();

const normalizeReservationCode = (value = "") => value.trim().toLowerCase();

export const hasAccommodationDateConflict = (left = {}, right = {}) => {
  const leftCheckIn = toDate(left.checkInDate);
  const leftCheckOut = toDate(left.checkOutDate || left.checkInDate);
  const rightCheckIn = toDate(right.checkInDate);
  const rightCheckOut = toDate(right.checkOutDate || right.checkInDate);

  if (!leftCheckIn || !leftCheckOut || !rightCheckIn || !rightCheckOut) {
    return false;
  }

  return leftCheckIn <= rightCheckOut && rightCheckIn <= leftCheckOut;
};

export const summarizeAccommodationReservation = (reservation = {}) => {
  const hotelName = reservation.hotelName || "Unassigned property";
  const checkIn = formatDate(reservation.checkInDate);
  const checkOut = formatDate(reservation.checkOutDate);
  const conflictCount = Array.isArray(reservation.conflicts) ? reservation.conflicts.length : 0;

  if (reservation.status === "confirmed") {
    const stayWindow =
      checkIn && checkOut ? ` from ${checkIn} to ${checkOut}` : checkIn ? ` starting ${checkIn}` : "";
    const conflictSuffix =
      conflictCount > 0 ? ` Attention: ${conflictCount} lodging conflict${conflictCount > 1 ? "s" : ""} detected.` : "";
    return {
      badgeLabel: "Confirmed",
      summary: `${hotelName} is confirmed${stayWindow}.${conflictSuffix}`,
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

export const buildAccommodationConflictMap = (reservations = []) => {
  const activeReservations = (reservations || []).filter(
    (reservation) => reservation.status !== "cancelled"
  );
  const conflictMap = new Map();

  activeReservations.forEach((reservation) => {
    conflictMap.set(String(reservation._id), []);
  });

  for (let index = 0; index < activeReservations.length; index += 1) {
    const current = activeReservations[index];
    const currentId = String(current._id);

    for (let compareIndex = index + 1; compareIndex < activeReservations.length; compareIndex += 1) {
      const candidate = activeReservations[compareIndex];
      const candidateId = String(candidate._id);

      const sameHotel =
        normalizeHotelName(current.hotelName) &&
        normalizeHotelName(current.hotelName) === normalizeHotelName(candidate.hotelName);
      const overlappingStay = sameHotel && hasAccommodationDateConflict(current, candidate);
      const duplicateReservationCode =
        normalizeReservationCode(current.reservationCode) &&
        normalizeReservationCode(current.reservationCode) === normalizeReservationCode(candidate.reservationCode);

      if (!overlappingStay && !duplicateReservationCode) {
        continue;
      }

      const currentConflicts = conflictMap.get(currentId) || [];
      const candidateConflicts = conflictMap.get(candidateId) || [];
      const conflictType = duplicateReservationCode ? "duplicate-reference" : "overlapping-stay";
      const sharedSummary = duplicateReservationCode
        ? `Shares reservation code ${current.reservationCode || candidate.reservationCode || "reference"}`
        : `Overlaps at ${current.hotelName || candidate.hotelName || "the same property"}`;

      currentConflicts.push({
        reservationId: candidateId,
        hotelName: candidate.hotelName || "",
        bookingGuestName: candidate.bookingGuestName || "",
        type: conflictType,
        summary: sharedSummary,
      });
      candidateConflicts.push({
        reservationId: currentId,
        hotelName: current.hotelName || "",
        bookingGuestName: current.bookingGuestName || "",
        type: conflictType,
        summary: sharedSummary,
      });

      conflictMap.set(currentId, currentConflicts);
      conflictMap.set(candidateId, candidateConflicts);
    }
  }

  return conflictMap;
};

export const buildAccommodationSupplierMessage = (reservation = {}) => {
  const hotelName = reservation.hotelName || "your property";
  const guestName = reservation.bookingGuestName || "our guest";
  const roomPlan = reservation.roomPlan || "the requested room plan";
  const dateRange = [
    formatDate(reservation.checkInDate),
    formatDate(reservation.checkOutDate || reservation.checkInDate),
  ]
    .filter(Boolean)
    .join(" to ");
  const stayLine = dateRange ? `Stay dates: ${dateRange}.` : "";
  const guestLine = reservation.guestCount ? `Guest count: ${reservation.guestCount}.` : "";
  const notesLine = reservation.notes ? `Notes: ${reservation.notes}` : "";

  return `Hello ${reservation.supplierName || "team"}, please confirm the booking for ${guestName} at ${hotelName}. Room plan: ${roomPlan}. ${stayLine} ${guestLine} ${notesLine}`.replace(/\s+/g, " ").trim();
};

export const enrichAccommodationReservations = (reservations = []) => {
  const conflictMap = buildAccommodationConflictMap(reservations);

  return (reservations || []).map((reservation) => {
    const conflicts = conflictMap.get(String(reservation._id)) || [];
    const nextReservation = {
      ...reservation,
      conflicts,
      conflictCount: conflicts.length,
      supplierMessageDraft: buildAccommodationSupplierMessage(reservation),
    };

    return {
      ...nextReservation,
      coordinationSummary: summarizeAccommodationReservation(nextReservation),
    };
  });
};

export const buildAccommodationDashboard = (bookings = [], reservations = []) =>
  (bookings || [])
    .filter((booking) => ["Confirmed", "Completed"].includes(booking.status))
    .map((booking) => {
      const linkedReservations = (reservations || []).filter(
        (reservation) => String(reservation.bookingId || "") === String(booking._id)
      );
      const activeReservations = linkedReservations.filter(
        (reservation) => reservation.status !== "cancelled"
      );
      const confirmedReservations = activeReservations.filter(
        (reservation) => reservation.status === "confirmed"
      );
      const pendingReservations = activeReservations.filter(
        (reservation) => reservation.status === "pending"
      );

      return {
        bookingId: booking._id,
        travelerName: booking.name,
        packageTour: booking.packageTour,
        travelDate: booking.travelDate,
        reservations: linkedReservations,
        confirmedReservations,
        pendingReservations,
        needsAccommodation: activeReservations.length === 0,
        hasConflict: linkedReservations.some((reservation) => (reservation.conflictCount || 0) > 0),
      };
    })
    .sort((left, right) => new Date(left.travelDate || 0).getTime() - new Date(right.travelDate || 0).getTime());

export const buildAccommodationStayTimeline = (reservations = []) => {
  const rows = new Map();

  (reservations || [])
    .filter((reservation) => reservation.status !== "cancelled")
    .forEach((reservation) => {
      const start = toDate(reservation.checkInDate);
      const end = toDate(reservation.checkOutDate || reservation.checkInDate);

      if (!start || !end) {
        return;
      }

      const cursor = new Date(start);
      while (cursor <= end) {
        const dateKey = cursor.toISOString().slice(0, 10);
        const current = rows.get(dateKey) || [];
        current.push({
          reservationId: reservation._id,
          hotelName: reservation.hotelName || "",
          bookingGuestName: reservation.bookingGuestName || "",
          status: reservation.status || "pending",
        });
        rows.set(dateKey, current);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    });

  return Array.from(rows.entries())
    .map(([date, stays]) => ({
      date,
      stays: stays.sort((left, right) =>
        `${left.hotelName}:${left.bookingGuestName}`.localeCompare(`${right.hotelName}:${right.bookingGuestName}`)
      ),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
};
