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

export const summarizeGuideDriverAssignment = (member = {}) => {
  const availability = member.availabilityStatus || "available";
  const staffLabel = member.staffType === "driver" ? "Driver" : "Guide";
  const dateLabel = formatDate(member.assignmentDate);

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
