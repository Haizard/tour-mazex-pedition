const businessTruthEntities = [
  {
    key: "bookings",
    label: "Bookings",
    currentOwner: "postgresql",
    targetOwner: "postgresql",
    migrationMode: "cutover",
    cutoverWave: 1,
    cutoverOrder: 1,
    serviceBoundary: "revenue-core",
    stores: ["mongodb", "postgresql", "redis"],
    notes:
      "Canonical traveler commitment, commercial state, and settlement lifecycle are now PostgreSQL-owned.",
  },
  {
    key: "payments",
    label: "Payments",
    currentOwner: "postgresql",
    targetOwner: "postgresql",
    migrationMode: "cutover",
    cutoverWave: 1,
    cutoverOrder: 2,
    serviceBoundary: "revenue-core",
    stores: ["mongodb", "postgresql", "redis"],
    notes:
      "Provider references, settlement states, refunds, and webhook idempotency are now PostgreSQL-owned.",
  },
  {
    key: "quotes",
    label: "Quotes",
    currentOwner: "postgresql",
    targetOwner: "postgresql",
    migrationMode: "cutover",
    cutoverWave: 2,
    cutoverOrder: 3,
    serviceBoundary: "revenue-core",
    stores: ["mongodb", "postgresql"],
    notes:
      "Proposal lifecycle and conversion states are now PostgreSQL-owned.",
  },
  {
    key: "travelers",
    label: "Travelers And Inquiries",
    currentOwner: "mongodb",
    targetOwner: "postgresql",
    migrationMode: "shadow-prep",
    cutoverWave: 2,
    cutoverOrder: 4,
    serviceBoundary: "crm-and-attribution",
    stores: ["mongodb", "postgresql", "pgvector"],
    notes:
      "Traveler identity, lead attribution, and structured CRM history should consolidate after quotes.",
  },
  {
    key: "guide-driver-assignments",
    label: "Guide And Driver Assignments",
    currentOwner: "mongodb",
    targetOwner: "postgresql",
    migrationMode: "shadow-prep",
    cutoverWave: 3,
    cutoverOrder: 5,
    serviceBoundary: "operations-core",
    stores: ["mongodb", "postgresql", "redis"],
    notes:
      "Operational scheduling and dispatch state should move once commercial records stop being Mongo-only.",
  },
  {
    key: "accommodation-reservations",
    label: "Accommodation Reservations",
    currentOwner: "mongodb",
    targetOwner: "postgresql",
    migrationMode: "shadow-prep",
    cutoverWave: 3,
    cutoverOrder: 6,
    serviceBoundary: "operations-core",
    stores: ["mongodb", "postgresql", "redis"],
    notes:
      "Supplier confirmations and occupancy timelines should become relational truth for conflict-safe planning.",
  },
  {
    key: "airport-pickups",
    label: "Airport Pickups",
    currentOwner: "mongodb",
    targetOwner: "postgresql",
    migrationMode: "shadow-prep",
    cutoverWave: 3,
    cutoverOrder: 7,
    serviceBoundary: "operations-core",
    stores: ["mongodb", "postgresql", "redis"],
    notes:
      "Arrival operations need durable scheduling semantics and async dispatch support.",
  },
  {
    key: "partner-contracts-and-attribution",
    label: "Partner Contracts And Attribution",
    currentOwner: "mongodb",
    targetOwner: "postgresql",
    migrationMode: "planned",
    cutoverWave: 4,
    cutoverOrder: 8,
    serviceBoundary: "distribution-and-network",
    stores: ["mongodb", "postgresql", "redis", "pgvector"],
    notes:
      "Commercial agreements, affiliate payouts, and attribution joins should land after the operational migration waves.",
  },
];

const infrastructureServices = [
  {
    key: "mongodb",
    label: "MongoDB",
    role: "Current application store and legacy operational read/write path",
    targetMode: "active",
  },
  {
    key: "postgresql",
    label: "PostgreSQL",
    role: "Future business system of record for bookings, payments, quotes, and operations truth",
    targetMode: "shadow-then-cutover",
  },
  {
    key: "redis",
    label: "Redis",
    role: "Async retries, locks, queues, deduplication, and scheduling coordination",
    targetMode: "supporting-infrastructure",
  },
  {
    key: "pgvector",
    label: "pgvector",
    role: "Semantic retrieval for traveler memory, content recall, and sales-assistant context",
    targetMode: "supporting-infrastructure",
  },
  {
    key: "s3",
    label: "S3-Compatible Storage",
    role: "Binary file ownership for uploads, generated documents, and media distribution",
    targetMode: "supporting-infrastructure",
  },
];

export const listBusinessTruthEntities = () =>
  businessTruthEntities
    .slice()
    .sort((left, right) => left.cutoverOrder - right.cutoverOrder)
    .map((item) => ({ ...item }));

export const summarizeInfrastructureTargets = () =>
  infrastructureServices.map((service) => ({ ...service }));

export const buildBusinessTruthCutoverPlan = () => {
  const entities = listBusinessTruthEntities();
  const groupedWaves = entities.reduce((waves, entity) => {
    const key = `wave-${entity.cutoverWave}`;
    if (!waves[key]) {
      waves[key] = {
        wave: entity.cutoverWave,
        label: `Wave ${entity.cutoverWave}`,
        entities: [],
      };
    }

    waves[key].entities.push(entity);
    return waves;
  }, {});

  return Object.values(groupedWaves).sort((left, right) => left.wave - right.wave);
};

export const getBusinessTruthEntity = (key = "") =>
  listBusinessTruthEntities().find((entity) => entity.key === key) || null;
