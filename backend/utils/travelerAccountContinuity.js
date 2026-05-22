import SavedTripList from "../models/SavedTripList.js";
import TravelerIdentity from "../models/TravelerIdentity.js";
import TripComparisonSet from "../models/TripComparisonSet.js";

const normalizeId = (value) => String(value || "").trim();

export const mergeUniqueValues = (...args) => {
  const options = args.at(-1);
  const hasOptions = options && !Array.isArray(options) && typeof options === "object";
  const values = hasOptions ? args.slice(0, -1) : args;
  const limit = hasOptions ? Number(options.limit || 0) : 0;
  const merged = [];

  for (const list of values) {
    for (const value of list || []) {
      const normalized = normalizeId(value);
      if (normalized && !merged.includes(normalized)) {
        merged.push(normalized);
      }
      if (limit && merged.length >= limit) {
        return merged;
      }
    }
  }

  return merged;
};

const getIdentityId = (identity = {}) => normalizeId(identity._id || identity.id);

const buildContinuityQuery = ({ identityId = "", sessionKey = "", email = "" } = {}) => ({
  $or: [
    ...(identityId ? [{ travelerIdentityId: identityId }] : []),
    ...(sessionKey ? [{ sessionKey }] : []),
    ...(email ? [{ email }] : []),
  ],
});

const pickPrimaryRecord = (records = [], identityId = "") =>
  records.find((record) => normalizeId(record.travelerIdentityId) === identityId) ||
  records[0] ||
  null;

const pickSavedTripReminders = (records = [], primary = {}) =>
  primary.reminders ||
  records.find((record) => record.reminders?.enabled)?.reminders ||
  undefined;

const mergeSavedTripLists = async ({ identityId, sessionKey, email, deps }) => {
  const records = await deps.loadSavedTripLists({ identityId, sessionKey, email });
  if (!records.length) {
    return 0;
  }

  const primary = pickPrimaryRecord(records, identityId);
  const duplicateIds = records
    .map((record) => normalizeId(record._id))
    .filter((id) => id && id !== normalizeId(primary._id));
  const payload = {
    travelerIdentityId: identityId,
    sessionKey,
    email,
    selectedTourIds: mergeUniqueValues(
      primary.selectedTourIds,
      ...records.filter((record) => record !== primary).map((record) => record.selectedTourIds),
      { limit: 24 }
    ),
    notes: primary.notes || records.find((record) => record.notes)?.notes || "",
  };
  const reminders = pickSavedTripReminders(records, primary);
  if (reminders) {
    payload.reminders = reminders;
  }

  await deps.updateSavedTripList(normalizeId(primary._id), payload);
  if (duplicateIds.length) {
    await deps.deleteSavedTripLists(duplicateIds);
  }

  return records.length;
};

const mergeComparisonSets = async ({ identityId, sessionKey, email, deps }) => {
  const records = await deps.loadComparisonSets({ identityId, sessionKey, email });
  if (!records.length) {
    return 0;
  }

  const primary = pickPrimaryRecord(records, identityId);
  const duplicateIds = records
    .map((record) => normalizeId(record._id))
    .filter((id) => id && id !== normalizeId(primary._id));
  const payload = {
    travelerIdentityId: identityId,
    sessionKey,
    email,
    selectedTourIds: mergeUniqueValues(
      primary.selectedTourIds,
      ...records.filter((record) => record !== primary).map((record) => record.selectedTourIds),
      { limit: 4 }
    ),
  };

  await deps.updateComparisonSet(normalizeId(primary._id), payload);
  if (duplicateIds.length) {
    await deps.deleteComparisonSets(duplicateIds);
  }

  return records.length;
};

const rankVerificationState = (state = "guest") =>
  ({
    guest: 0,
    "verified-inquiry": 1,
    "verified-booking": 2,
  })[state] ?? 0;

const pickVerificationState = (records = []) =>
  records.some((record) => (record.linkedBookingIds || []).length > 0)
    ? "verified-booking"
    : records.reduce(
        (best, record) =>
          rankVerificationState(record.verificationState) > rankVerificationState(best)
            ? record.verificationState
            : best,
        "guest"
      );

const mergeDuplicateIdentities = async ({ identity, identityId, sessionKey, email, deps }) => {
  const duplicates = await deps.loadDuplicateIdentities({ identityId, sessionKey, email });
  const records = [identity, ...duplicates];
  const payload = {
    sessionKey,
    email,
    verificationState: pickVerificationState(records),
    linkedInquiryIds: mergeUniqueValues(...records.map((record) => record.linkedInquiryIds)),
    linkedBookingIds: mergeUniqueValues(...records.map((record) => record.linkedBookingIds)),
  };

  await deps.updateTravelerIdentity(identityId, payload);

  const duplicateIds = duplicates.map((record) => normalizeId(record._id)).filter(Boolean);
  if (duplicateIds.length) {
    await deps.deleteTravelerIdentities(duplicateIds);
  }

  return records.length;
};

export const createMongooseTravelerContinuityDeps = () => ({
  loadSavedTripLists: async ({ identityId, sessionKey, email }) =>
    SavedTripList.find(buildContinuityQuery({ identityId, sessionKey, email })).lean(),
  updateSavedTripList: async (id, payload) =>
    SavedTripList.findByIdAndUpdate(id, { $set: payload }, { new: true }),
  deleteSavedTripLists: async (ids) => SavedTripList.deleteMany({ _id: { $in: ids } }),
  loadComparisonSets: async ({ identityId, sessionKey, email }) =>
    TripComparisonSet.find(buildContinuityQuery({ identityId, sessionKey, email })).lean(),
  updateComparisonSet: async (id, payload) =>
    TripComparisonSet.findByIdAndUpdate(id, { $set: payload }, { new: true }),
  deleteComparisonSets: async (ids) => TripComparisonSet.deleteMany({ _id: { $in: ids } }),
  loadDuplicateIdentities: async ({ identityId, sessionKey, email }) =>
    TravelerIdentity.find({
      _id: { $ne: identityId },
      $or: [
        ...(sessionKey ? [{ sessionKey }] : []),
        ...(email ? [{ email }] : []),
      ],
    }).lean(),
  updateTravelerIdentity: async (id, payload) =>
    TravelerIdentity.findByIdAndUpdate(id, { $set: payload }, { new: true }),
  deleteTravelerIdentities: async (ids) => TravelerIdentity.deleteMany({ _id: { $in: ids } }),
});

export const mergeTravelerAccountContinuity = async (
  { identity, sessionKey = "", email = "" } = {},
  deps = createMongooseTravelerContinuityDeps()
) => {
  const identityId = getIdentityId(identity);
  const normalizedSessionKey = String(sessionKey || identity?.sessionKey || "").trim();
  const normalizedEmail = String(email || identity?.email || "").trim().toLowerCase();

  if (!identityId || (!normalizedSessionKey && !normalizedEmail)) {
    return {
      identitiesMerged: identityId ? 1 : 0,
      savedTripListsMerged: 0,
      comparisonSetsMerged: 0,
    };
  }

  const savedTripListsMerged = await mergeSavedTripLists({
    identityId,
    sessionKey: normalizedSessionKey,
    email: normalizedEmail,
    deps,
  });
  const comparisonSetsMerged = await mergeComparisonSets({
    identityId,
    sessionKey: normalizedSessionKey,
    email: normalizedEmail,
    deps,
  });
  const identitiesMerged = await mergeDuplicateIdentities({
    identity,
    identityId,
    sessionKey: normalizedSessionKey,
    email: normalizedEmail,
    deps,
  });

  return {
    identitiesMerged,
    savedTripListsMerged,
    comparisonSetsMerged,
  };
};
