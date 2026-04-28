const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const hasAssignmentWindowConflict = (left = {}, right = {}) => {
  const leftStart = toDate(left.assignmentStartDate || left.assignmentDate);
  const leftEnd = toDate(left.assignmentEndDate || left.assignmentStartDate || left.assignmentDate);
  const rightStart = toDate(right.assignmentStartDate || right.assignmentDate);
  const rightEnd = toDate(right.assignmentEndDate || right.assignmentStartDate || right.assignmentDate);

  if (!leftStart || !leftEnd || !rightStart || !rightEnd) {
    return false;
  }

  return leftStart <= rightEnd && rightStart <= leftEnd;
};

export const summarizeGuideDriverAssignment = (member = {}) => {
  const availability = member.availabilityStatus || "available";
  const staffLabel = member.staffType === "driver" ? "Driver" : "Guide";
  const startLabel = formatDate(member.assignmentStartDate || member.assignmentDate);
  const endLabel = formatDate(member.assignmentEndDate);
  const dateLabel =
    startLabel && endLabel && startLabel !== endLabel
      ? `${startLabel} to ${endLabel}`
      : startLabel;

  if (availability === "assigned" && member.assignedTourTitle) {
    return {
      badgeLabel: "Assigned",
      summary: `${staffLabel} assigned to ${member.assignedTourTitle}${dateLabel ? ` on ${dateLabel}` : ""}.`,
    };
  }

  if (availability === "off-duty") {
    return {
      badgeLabel: "Off Duty",
      summary: `${staffLabel} is currently off duty and unavailable for new assignments.`,
    };
  }

  return {
    badgeLabel: "Available",
    summary: `${staffLabel} is available and ready for assignment.`,
  };
};

export const buildGuideDriverDispatchBoard = (bookings = [], team = []) =>
  (bookings || [])
    .filter((booking) => ["Confirmed", "Completed"].includes(booking.status))
    .map((booking) => {
      const assignedGuides = team.filter(
        (member) => member.staffType === "guide" && String(member.assignedBookingId || "") === String(booking._id)
      );
      const assignedDrivers = team.filter(
        (member) => member.staffType === "driver" && String(member.assignedBookingId || "") === String(booking._id)
      );

      return {
        bookingId: booking._id,
        travelerName: booking.name,
        packageTour: booking.packageTour,
        travelDate: booking.travelDate,
        assignedGuides,
        assignedDrivers,
        needsGuide: assignedGuides.length === 0,
        needsDriver: assignedDrivers.length === 0,
      };
    })
    .sort((left, right) => new Date(left.travelDate || 0).getTime() - new Date(right.travelDate || 0).getTime());

export const buildGuideDriverCalendarView = (team = []) => {
  const rows = new Map();

  (team || [])
    .filter((member) => member.availabilityStatus === "assigned")
    .forEach((member) => {
      const start = toDate(member.assignmentStartDate || member.assignmentDate);
      const end = toDate(member.assignmentEndDate || member.assignmentStartDate || member.assignmentDate);

      if (!start || !end) {
        return;
      }

      const cursor = new Date(start);
      while (cursor <= end) {
        const dateKey = cursor.toISOString().slice(0, 10);
        const current = rows.get(dateKey) || [];
        current.push({
          memberId: member._id,
          fullName: member.fullName,
          staffType: member.staffType,
          assignedTourTitle: member.assignedTourTitle || "",
          assignedBookingId: member.assignedBookingId || null,
        });
        rows.set(dateKey, current);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    });

  return Array.from(rows.entries())
    .map(([date, assignments]) => ({
      date,
      assignments: assignments.sort((left, right) =>
        `${left.staffType}:${left.fullName}`.localeCompare(`${right.staffType}:${right.fullName}`)
      ),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
};
