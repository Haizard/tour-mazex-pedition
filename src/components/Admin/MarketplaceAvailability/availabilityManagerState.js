const normalize = (value = "") => String(value || "").trim().toLowerCase();

export const filterAvailabilityRows = (rows = [], filters = {}) => {
  const search = normalize(filters.search);

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (filters.packageId && row.tourId !== filters.packageId) {
      return false;
    }

    if (filters.status && row.status !== filters.status) {
      return false;
    }

    if (filters.month && !String(row.dateKey || "").startsWith(filters.month)) {
      return false;
    }

    if (filters.instantReady === true && row.instantReady !== true) {
      return false;
    }

    if (filters.requestOnly === true && row.requestOnly !== true) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [row.packageTitle, row.location, row.note, row.dateKey]
      .map(normalize)
      .some((value) => value.includes(search));
  });
};

export const toggleAvailabilitySelection = (selectedRowIds = [], rowId = "") => {
  const set = new Set(selectedRowIds || []);
  if (set.has(rowId)) {
    set.delete(rowId);
  } else if (rowId) {
    set.add(rowId);
  }
  return [...set];
};

export const buildAvailabilityBulkPayload = ({
  action = "",
  rowIds = [],
  rows = [],
  status = "",
  published = false,
  delta = 0,
  note = "",
} = {}) => {
  const selectedRows = (rows || []).filter((row) => (rowIds || []).includes(row.rowId));
  const tours = [...new Set(selectedRows.map((row) => row.tourId).filter(Boolean))];
  if (tours.length !== 1) {
    throw new Error("Bulk actions currently require rows from one package.");
  }

  return {
    tourId: tours[0],
    payload: {
      action,
      dateKeys: selectedRows.map((row) => row.dateKey),
      ...(status ? { status } : {}),
      ...(action === "set-published" ? { published } : {}),
      ...(action === "adjust-spots" ? { delta } : {}),
      ...(action === "set-note" ? { note } : {}),
    },
  };
};

export const buildDrawerDraft = (entry = {}) => ({
  date: String(entry.date || "").slice(0, 10),
  status: entry.status || "available",
  published: entry.published !== false,
  remainingSpots:
    typeof entry.remainingSpots === "number" ? entry.remainingSpots : "",
  note: entry.note || "",
});
