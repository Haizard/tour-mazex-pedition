const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const EAST_AFRICA_REGION_PRESETS = {
  kilimanjaro: { x: 62, y: 64 },
  "northern circuit": { x: 44, y: 46 },
  serengeti: { x: 34, y: 42 },
  zanzibar: { x: 80, y: 72 },
  uganda: { x: 22, y: 30 },
  kenya: { x: 52, y: 24 },
  rwanda: { x: 18, y: 42 },
  arusha: { x: 50, y: 54 },
};

const normalizeRegionLabel = (tour = {}) => {
  const explicit = String(tour.location || "").trim();
  if (explicit) {
    return explicit;
  }

  const destination = Array.isArray(tour.destinationsVisited)
    ? String(tour.destinationsVisited[0] || "").trim()
    : "";
  if (destination) {
    return destination;
  }

  return "East Africa";
};

const buildRegionCoordinates = (label = "") => {
  const normalized = label.trim().toLowerCase();
  if (EAST_AFRICA_REGION_PRESETS[normalized]) {
    return EAST_AFRICA_REGION_PRESETS[normalized];
  }

  let hash = 0;
  for (const char of normalized) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }

  return {
    x: clamp(18 + (hash % 60), 16, 84),
    y: clamp(18 + (Math.floor(hash / 97) % 58), 16, 82),
  };
};

export const buildMarketplaceRegionSummaries = (tours = []) => {
  const grouped = new Map();

  for (const tour of tours) {
    const label = normalizeRegionLabel(tour);
    const key = label.toLowerCase();
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "east-africa",
        label,
        coordinates: buildRegionCoordinates(label),
        tourCount: 0,
        operatorIds: new Set(),
        destinations: new Set(),
        startingPrice: Number(tour.price || 0) || 0,
        sampleTours: [],
      });
    }

    const region = grouped.get(key);
    region.tourCount += 1;
    region.startingPrice =
      region.startingPrice > 0
        ? Math.min(region.startingPrice, Number(tour.price || 0) || region.startingPrice)
        : Number(tour.price || 0) || 0;
    region.operatorIds.add(String(tour.tenantId?._id || tour.tenantId || ""));
    for (const destination of Array.isArray(tour.destinationsVisited) ? tour.destinationsVisited : []) {
      if (destination) {
        region.destinations.add(String(destination).trim());
      }
    }
    if (region.sampleTours.length < 3) {
      region.sampleTours.push({
        id: String(tour._id || ""),
        title: tour.title || "",
      });
    }
  }

  return [...grouped.values()]
    .map((region) => ({
      id: region.id,
      label: region.label,
      coordinates: region.coordinates,
      tourCount: region.tourCount,
      operatorCount: region.operatorIds.size,
      destinations: [...region.destinations].slice(0, 5),
      startingPrice: region.startingPrice || 0,
      sampleTours: region.sampleTours,
    }))
    .sort((left, right) => right.tourCount - left.tourCount || left.label.localeCompare(right.label));
};

