import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaSearch, FaStore, FaUtensils } from "react-icons/fa";
import {
  searchRestaurantClaimListings,
  submitRestaurantClaimRequest,
} from "../services/api";
import {
  buildRestaurantClaimPayload,
  buildRestaurantClaimSearchParams,
  createEmptyRestaurantClaimDraft,
} from "./restaurantClaimPageState";

const RestaurantClaimPage = () => {
  const [filters, setFilters] = useState({ q: "", destination: "" });
  const [results, setResults] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [draft, setDraft] = useState(createEmptyRestaurantClaimDraft);
  const [searching, setSearching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadResults = async () => {
      setSearching(true);
      try {
        const response = await searchRestaurantClaimListings(
          buildRestaurantClaimSearchParams(filters)
        );
        setResults(response.data?.restaurants || []);
      } catch (error) {
        console.error("Restaurant claim search failed:", error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    };

    loadResults();
  }, [filters]);

  const selectedRestaurant = useMemo(
    () =>
      results.find(
        (restaurant) => (restaurant.id || restaurant._id) === selectedRestaurantId
      ) || null,
    [results, selectedRestaurantId]
  );

  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submitClaim = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const payload = buildRestaurantClaimPayload(draft, selectedRestaurant);
      await submitRestaurantClaimRequest(payload);
      setMessage(
        draft.claimType === "new-listing-request"
          ? "Your new restaurant listing request has been submitted for review."
          : "Your restaurant claim request has been submitted for review."
      );
      setDraft(createEmptyRestaurantClaimDraft());
      setSelectedRestaurantId("");
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          "Unable to submit your restaurant claim right now."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f1e8] px-5 pb-16 pt-32 text-slate-900 md:pt-40">
      <section className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-[#d8c8ae] bg-white p-8 shadow-[0_24px_80px_rgba(35,66,50,0.08)]">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#8b7451]">
              Restaurant Partner Access
            </p>
            <h1 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-5xl">
              Claim your restaurant listing
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600">
              Search for your restaurant first, request access to an existing listing,
              or send a fallback new listing request for review.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <span className="rounded-full bg-[#eef6f0] px-3 py-2 text-[#234232]">
                Claim existing listing first
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-2">
                Fallback new listing request
              </span>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#d8c8ae] bg-white p-6 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center rounded-2xl border border-slate-200 px-3 py-2">
                <FaSearch className="mr-2 text-slate-400" />
                <input
                  value={filters.q}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, q: event.target.value }))
                  }
                  placeholder="Search restaurant name"
                  className="w-full bg-transparent text-sm font-medium outline-none"
                />
              </label>
              <input
                value={filters.destination}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    destination: event.target.value,
                  }))
                }
                placeholder="Destination"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none"
              />
            </div>
            <div className="mt-5 space-y-3">
              {searching ? (
                <p className="text-sm font-semibold text-slate-500">
                  Searching restaurants...
                </p>
              ) : results.length ? (
                results.map((restaurant) => {
                  const restaurantId = restaurant.id || restaurant._id;

                  return (
                    <button
                      key={restaurantId}
                      type="button"
                      onClick={() => {
                        setSelectedRestaurantId(restaurantId);
                        updateDraft("claimType", "existing-listing");
                      }}
                      className={`flex w-full items-start justify-between rounded-2xl border p-4 text-left transition ${
                        selectedRestaurantId === restaurantId &&
                        draft.claimType === "existing-listing"
                          ? "border-[#234232] bg-[#eef6f0]"
                          : "border-slate-200 bg-white hover:border-[#d8c8ae]"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-900">
                          {restaurant.name}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {restaurant.destination || "Destination on request"}
                          {restaurant.region ? ` · ${restaurant.region}` : ""}
                        </p>
                        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
                          {(restaurant.cuisineTypes || []).join(", ") || "Restaurant"}
                        </p>
                      </div>
                      {selectedRestaurantId === restaurantId &&
                      draft.claimType === "existing-listing" ? (
                        <FaCheckCircle className="mt-1 text-[#234232]" />
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-medium text-slate-600">
                  No matching listing yet. You can still continue with a new
                  restaurant listing request.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedRestaurantId("");
                updateDraft("claimType", "new-listing-request");
              }}
              className={`mt-5 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] ${
                draft.claimType === "new-listing-request"
                  ? "bg-[#234232] text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              <FaStore /> Request new restaurant listing
            </button>
          </div>
        </div>

        <form
          onSubmit={submitClaim}
          className="rounded-[32px] border border-[#d8c8ae] bg-white p-8 shadow-[0_24px_80px_rgba(35,66,50,0.08)]"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
            {draft.claimType === "new-listing-request"
              ? "New Listing Request"
              : "Claim Request"}
          </p>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-slate-900">
            {draft.claimType === "new-listing-request"
              ? "Tell us about the restaurant"
              : selectedRestaurant
                ? `Claim ${selectedRestaurant.name}`
                : "Select your restaurant first"}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["claimantName", "Your name"],
              ["claimantEmail", "Work email"],
              ["claimantPhone", "Phone / WhatsApp"],
              ["requestedUsername", "Preferred username (optional)"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {label}
                </span>
                <input
                  value={draft[key] || ""}
                  onChange={(event) => updateDraft(key, event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-[#234232]"
                  required={key !== "claimantPhone" && key !== "requestedUsername"}
                />
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Role
              </span>
              <select
                value={draft.claimantRole}
                onChange={(event) => updateDraft("claimantRole", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-[#234232]"
              >
                <option value="restaurant-owner">Restaurant owner</option>
                <option value="restaurant-manager">Restaurant manager</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Password
              </span>
              <input
                type="password"
                value={draft.password}
                onChange={(event) => updateDraft("password", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-[#234232]"
                required
              />
            </label>
          </div>

          {draft.claimType === "new-listing-request" ? (
            <div className="mt-6 space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              {[
                ["proposedRestaurantName", "Restaurant name"],
                ["proposedDestination", "Destination"],
                ["proposedRegion", "Region"],
                ["proposedCuisineTypes", "Cuisine types"],
                ["proposedMealTypes", "Meal types"],
                ["proposedDietaryFits", "Dietary fits"],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {label}
                  </span>
                  <input
                    value={draft[key] || ""}
                    onChange={(event) => updateDraft(key, event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-[#234232]"
                    required={
                      key === "proposedRestaurantName" || key === "proposedDestination"
                    }
                  />
                </label>
              ))}
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Photo URLs
                </span>
                <textarea
                  rows={3}
                  value={draft.proposedPhotos}
                  onChange={(event) => updateDraft("proposedPhotos", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-[#234232]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Short summary
                </span>
                <textarea
                  rows={3}
                  value={draft.proposedSummary}
                  onChange={(event) => updateDraft("proposedSummary", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-[#234232]"
                />
              </label>
            </div>
          ) : null}

          <label className="mt-6 block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Proof note
            </span>
            <textarea
              rows={4}
              value={draft.proofNote}
              onChange={(event) => updateDraft("proofNote", event.target.value)}
              placeholder="Tell us how you are connected to this restaurant."
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-[#234232]"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Proof links
            </span>
            <input
              value={draft.proofLinks}
              onChange={(event) => updateDraft("proofLinks", event.target.value)}
              placeholder="Website, Instagram, Google Business"
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-[#234232]"
            />
          </label>

          <button
            type="submit"
            disabled={
              submitting ||
              (draft.claimType !== "new-listing-request" && !selectedRestaurant)
            }
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#234232] px-4 py-4 text-xs font-black uppercase tracking-[0.18em] text-white disabled:bg-slate-300"
          >
            <FaUtensils />
            {submitting ? "Submitting..." : "Submit request"}
          </button>
          {message ? (
            <p className="mt-4 text-sm font-semibold text-slate-600">{message}</p>
          ) : null}

          <p className="mt-6 text-xs font-semibold leading-6 text-slate-500">
            Already approved?{" "}
            <Link to="/restaurant-partner/login" className="font-black text-[#234232]">
              Sign in as a restaurant partner
            </Link>
          </p>
          <p className="mt-2 text-xs font-semibold leading-6 text-slate-500">
            We review each submission before restaurant partner access is approved.
          </p>
        </form>
      </section>
    </div>
  );
};

export default RestaurantClaimPage;
