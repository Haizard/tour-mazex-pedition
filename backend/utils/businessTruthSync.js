export const createBusinessTruthMetadataDefaults = ({
  entityKey = "",
  currentOwner = "mongodb",
  targetOwner = "postgresql",
  migrationMode = "shadow-prep",
} = {}) => ({
  entityKey,
  currentOwner,
  targetOwner,
  migrationMode,
  migrationStatus: "not-started",
  shadowWriteEnabled: false,
  canonicalId: "",
  truthVersion: 1,
  lastShadowSyncAt: null,
  lastCutoverAt: null,
});

export const createBusinessTruthMetadataSchemaDefinition = ({
  entityKey = "",
  currentOwner = "mongodb",
  targetOwner = "postgresql",
  migrationMode = "shadow-prep",
} = {}) => ({
  entityKey: { type: String, default: entityKey, trim: true },
  currentOwner: { type: String, default: currentOwner, trim: true, index: true },
  targetOwner: { type: String, default: targetOwner, trim: true },
  migrationMode: { type: String, default: migrationMode, trim: true },
  migrationStatus: {
    type: String,
    enum: ["not-started", "pending", "shadowed", "cutover-ready", "cutover"],
    default: "not-started",
    index: true,
  },
  shadowWriteEnabled: { type: Boolean, default: false },
  canonicalId: { type: String, default: "", trim: true },
  truthVersion: { type: Number, default: 1, min: 1 },
  lastShadowSyncAt: { type: Date, default: null },
  lastCutoverAt: { type: Date, default: null },
});

export const markBusinessTruthSyncPending = (metadata = {}, patch = {}) => ({
  ...metadata,
  migrationStatus: "pending",
  shadowWriteEnabled: true,
  truthVersion: Number(metadata.truthVersion || 1) + 1,
  ...patch,
});

export const markBusinessTruthSyncCompleted = (metadata = {}, patch = {}) => {
  const now = patch.lastShadowSyncAt || new Date();
  return {
    ...metadata,
    migrationStatus: patch.migrationStatus || "shadowed",
    shadowWriteEnabled:
      patch.shadowWriteEnabled === undefined ? true : Boolean(patch.shadowWriteEnabled),
    lastShadowSyncAt: now,
    truthVersion: Number(metadata.truthVersion || 1),
    ...patch,
  };
};

export const buildShadowRecordSnapshot = (metadata = {}, payload = {}) => ({
  entityKey: metadata.entityKey || payload.entityKey || "",
  currentOwner: metadata.currentOwner || "mongodb",
  targetOwner: metadata.targetOwner || "postgresql",
  migrationStatus: metadata.migrationStatus || "not-started",
  truthVersion: Number(metadata.truthVersion || 1),
  canonicalId: metadata.canonicalId || "",
  payload,
});
