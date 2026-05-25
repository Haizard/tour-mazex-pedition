/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import {
  buildRestaurantClaimReviewPayload,
  filterRestaurantClaimRows,
} from "./restaurantClaimManagerState";

const toLinks = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const RestaurantClaimManager = ({
  claims = [],
  reviewingClaimAction = "",
  onReview,
}) => {
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [reviewNotes, setReviewNotes] = useState({});

  const visibleClaims = useMemo(
    () => filterRestaurantClaimRows(claims, filters),
    [claims, filters]
  );

  const updateReviewNote = (claimId, value) => {
    setReviewNotes((current) => ({ ...current, [claimId]: value }));
  };

  const submitReview = (claimId, action) => {
    onReview(claimId, buildRestaurantClaimReviewPayload(action, reviewNotes[claimId]));
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Restaurant Self-Registration
          </p>
          <h3 className="mt-2 text-lg font-black text-zinc-950">
            Claim requests queue
          </h3>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex items-center rounded-xl border border-zinc-200 px-3 py-2">
            <FaSearch className="mr-2 text-zinc-400" />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search claims"
              className="bg-transparent text-sm font-medium outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value }))
            }
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="needs-more-proof">Needs more proof</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {visibleClaims.map((claim) => {
          const claimId = claim.id || claim._id;
          const proofLinks = toLinks(claim.proofLinks);
          const proposedRestaurant = claim.proposedRestaurantPayload || {};

          return (
            <div key={claimId} className="rounded-xl border border-zinc-200 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black text-zinc-950">
                    {claim.restaurantNameSnapshot || "Proposed restaurant listing"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-600">
                    {claim.destinationSnapshot || "Destination pending"} ·{" "}
                    {claim.claimType === "new-listing-request"
                      ? "New listing request"
                      : "Existing listing claim"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-600">
                      {claim.status || "pending"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      {claim.claimantRole || "restaurant-owner"}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      {claim.requestedUsername || "Email fallback"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-zinc-700">
                    {claim.claimantName} · {claim.claimantEmail}
                  </p>
                  {claim.claimantPhone ? (
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {claim.claimantPhone}
                    </p>
                  ) : null}
                  {claim.proofNote ? (
                    <p className="mt-3 text-sm font-medium leading-6 text-zinc-600">
                      {claim.proofNote}
                    </p>
                  ) : null}
                  {proofLinks.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {proofLinks.map((link) => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-zinc-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-600"
                        >
                          Proof Link
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {claim.claimType === "new-listing-request" ? (
                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                        Proposed listing payload
                      </p>
                      <p className="mt-2 text-sm font-semibold text-zinc-700">
                        {(proposedRestaurant.cuisineTypes || []).join(", ") ||
                          "Cuisine types pending"}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {(proposedRestaurant.mealTypes || []).join(", ") ||
                          "Meal types pending"}
                      </p>
                      {proposedRestaurant.summary ? (
                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                          {proposedRestaurant.summary}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <label className="mt-4 block">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Review note (optional)
                    </span>
                    <textarea
                      rows={3}
                      value={reviewNotes[claimId] || ""}
                      onChange={(event) => updateReviewNote(claimId, event.target.value)}
                      placeholder="Internal note or message for the claimant."
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                    />
                  </label>
                </div>

                {["pending", "needs-more-proof"].includes(claim.status) ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => submitReview(claimId, "approve")}
                      disabled={reviewingClaimAction === `${claimId}:approve`}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black uppercase text-white disabled:bg-zinc-300"
                    >
                      {reviewingClaimAction === `${claimId}:approve`
                        ? "Approving..."
                        : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitReview(claimId, "needs-more-proof")}
                      disabled={
                        reviewingClaimAction === `${claimId}:needs-more-proof`
                      }
                      className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-black uppercase text-amber-700 disabled:text-zinc-300"
                    >
                      {reviewingClaimAction === `${claimId}:needs-more-proof`
                        ? "Updating..."
                        : "Need proof"}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitReview(claimId, "reject")}
                      disabled={reviewingClaimAction === `${claimId}:reject`}
                      className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black uppercase text-red-600 disabled:text-zinc-300"
                    >
                      {reviewingClaimAction === `${claimId}:reject`
                        ? "Rejecting..."
                        : "Reject"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {!visibleClaims.length ? (
          <p className="py-8 text-center text-sm font-bold text-zinc-500">
            No restaurant claim requests in this view yet.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default RestaurantClaimManager;
