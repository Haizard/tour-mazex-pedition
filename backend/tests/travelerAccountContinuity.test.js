import test from "node:test";
import assert from "node:assert/strict";

import {
  mergeTravelerAccountContinuity,
  mergeUniqueValues,
} from "../utils/travelerAccountContinuity.js";

test("mergeUniqueValues preserves order while removing duplicate identifiers", () => {
  assert.deepEqual(
    mergeUniqueValues(["tour_1", "tour_2"], ["tour_2", "tour_3"], { limit: 3 }),
    ["tour_1", "tour_2", "tour_3"]
  );
});

test("mergeTravelerAccountContinuity attaches guest saved trips and comparisons to Google identity", async () => {
  const operations = [];
  const savedTripLists = [
    {
      _id: "saved_guest",
      travelerIdentityId: null,
      sessionKey: "traveler_session",
      email: "",
      selectedTourIds: ["tour_1", "tour_2"],
      notes: "guest note",
    },
    {
      _id: "saved_identity",
      travelerIdentityId: "identity_1",
      sessionKey: "",
      email: "asha@example.com",
      selectedTourIds: ["tour_2", "tour_3"],
      notes: "",
    },
  ];
  const comparisonSets = [
    {
      _id: "compare_guest",
      travelerIdentityId: null,
      sessionKey: "traveler_session",
      email: "",
      selectedTourIds: ["tour_1", "tour_2", "tour_3"],
    },
    {
      _id: "compare_identity",
      travelerIdentityId: "identity_1",
      sessionKey: "",
      email: "asha@example.com",
      selectedTourIds: ["tour_4"],
    },
  ];

  const summary = await mergeTravelerAccountContinuity(
    {
      identity: { _id: "identity_1", linkedInquiryIds: [], linkedBookingIds: [] },
      sessionKey: "traveler_session",
      email: "asha@example.com",
    },
    {
      loadSavedTripLists: async () => savedTripLists,
      updateSavedTripList: async (id, payload) => operations.push(["updateSavedTripList", id, payload]),
      deleteSavedTripLists: async (ids) => operations.push(["deleteSavedTripLists", ids]),
      loadComparisonSets: async () => comparisonSets,
      updateComparisonSet: async (id, payload) => operations.push(["updateComparisonSet", id, payload]),
      deleteComparisonSets: async (ids) => operations.push(["deleteComparisonSets", ids]),
      loadDuplicateIdentities: async () => [],
      updateTravelerIdentity: async (_id, payload) => operations.push(["updateTravelerIdentity", payload]),
      deleteTravelerIdentities: async () => {},
    }
  );

  assert.equal(summary.savedTripListsMerged, 2);
  assert.equal(summary.comparisonSetsMerged, 2);
  assert.deepEqual(operations[0], [
    "updateSavedTripList",
    "saved_identity",
    {
      travelerIdentityId: "identity_1",
      sessionKey: "traveler_session",
      email: "asha@example.com",
      selectedTourIds: ["tour_2", "tour_3", "tour_1"],
      notes: "guest note",
    },
  ]);
  assert.deepEqual(operations[2], [
    "updateComparisonSet",
    "compare_identity",
    {
      travelerIdentityId: "identity_1",
      sessionKey: "traveler_session",
      email: "asha@example.com",
      selectedTourIds: ["tour_4", "tour_1", "tour_2", "tour_3"],
    },
  ]);
});

test("mergeTravelerAccountContinuity preserves inquiry links from matching guest identities", async () => {
  const identityUpdates = [];

  const summary = await mergeTravelerAccountContinuity(
    {
      identity: {
        _id: "identity_google",
        verificationState: "guest",
        linkedInquiryIds: ["inq_existing"],
        linkedBookingIds: [],
      },
      sessionKey: "traveler_session",
      email: "asha@example.com",
    },
    {
      loadSavedTripLists: async () => [],
      updateSavedTripList: async () => {},
      deleteSavedTripLists: async () => {},
      loadComparisonSets: async () => [],
      updateComparisonSet: async () => {},
      deleteComparisonSets: async () => {},
      loadDuplicateIdentities: async () => [
        {
          _id: "identity_guest",
          verificationState: "verified-inquiry",
          linkedInquiryIds: ["inq_guest", "inq_existing"],
          linkedBookingIds: ["book_guest"],
        },
      ],
      updateTravelerIdentity: async (_id, payload) => identityUpdates.push(payload),
      deleteTravelerIdentities: async (ids) => identityUpdates.push({ deleted: ids }),
    }
  );

  assert.equal(summary.identitiesMerged, 2);
  assert.deepEqual(identityUpdates[0], {
    sessionKey: "traveler_session",
    email: "asha@example.com",
    verificationState: "verified-booking",
    linkedInquiryIds: ["inq_existing", "inq_guest"],
    linkedBookingIds: ["book_guest"],
  });
  assert.deepEqual(identityUpdates[1], { deleted: ["identity_guest"] });
});
