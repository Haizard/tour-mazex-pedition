import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchHotelPartnerHotels,
  updateHotelPartnerHotel,
} from "../services/api";
import {
  buildPartnerHotelUpdatePayload,
  createEmptyPartnerHotelDraft,
  filterPartnerHotels,
} from "../components/HotelPartner/hotelPartnerDashboardState";

const toDraft = (hotel = {}) => ({
  ...createEmptyPartnerHotelDraft(),
  name: hotel.name || "",
  summary: hotel.summary || "",
  description: hotel.description || "",
  destination: hotel.destination || "",
  region: hotel.region || "",
  amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(", ") : "",
  roomStyleSummary: hotel.roomStyleSummary || "",
  photos: Array.isArray(hotel.photos) ? hotel.photos.join("\n") : "",
  trustSummary: hotel.trustSummary || "",
});

const HotelPartnerDashboard = () => {
  const [hotels, setHotels] = useState([]);
  const [activeHotelId, setActiveHotelId] = useState("");
  const [draft, setDraft] = useState(createEmptyPartnerHotelDraft());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filteredHotels = useMemo(() => filterPartnerHotels(hotels, search), [hotels, search]);
  const activeHotel = hotels.find((hotel) => String(hotel._id) === String(activeHotelId));

  const loadHotels = useCallback(async () => {
    const response = await fetchHotelPartnerHotels();
    const nextHotels = response.data.hotels || [];
    setHotels(nextHotels);
    const firstHotel = nextHotels[0] || null;
    if (firstHotel && !activeHotelId) {
      setActiveHotelId(firstHotel._id);
      setDraft(toDraft(firstHotel));
    }
  }, [activeHotelId]);

  useEffect(() => {
    loadHotels().catch((error) => {
      setStatus(error.response?.data?.message || "Could not load assigned hotels.");
    });
  }, [loadHotels]);

  const selectHotel = (hotel) => {
    setActiveHotelId(hotel._id);
    setDraft(toDraft(hotel));
    setStatus("");
  };

  const saveHotel = async (event) => {
    event.preventDefault();
    if (!activeHotelId) {
      return;
    }

    setStatus("Saving...");
    await updateHotelPartnerHotel(activeHotelId, buildPartnerHotelUpdatePayload(draft));
    await loadHotels();
    setStatus("Profile saved for operator review.");
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Hotel Partner Portal
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Assigned hotel profiles</h1>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assigned hotels"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold md:max-w-xs"
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-3">
            {filteredHotels.map((hotel) => (
              <button
                key={hotel._id}
                type="button"
                onClick={() => selectHotel(hotel)}
                className={`w-full rounded-xl border p-4 text-left ${
                  String(activeHotelId) === String(hotel._id)
                    ? "border-primary bg-primary/10"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="font-black">{hotel.name}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {hotel.destination || "Destination pending"}
                </p>
              </button>
            ))}
          </aside>

          <form onSubmit={saveHotel} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Profile controls
              </p>
              <h2 className="mt-2 text-2xl font-black">{activeHotel?.name || "Select a hotel"}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Visibility, publishing, and sponsored placement stay with the tourism tenant admin.
              </p>
            </div>

            {["name", "summary", "description", "destination", "region", "roomStyleSummary", "trustSummary"].map((field) => (
              <label key={field} className="mb-4 block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                  {field}
                </span>
                <textarea
                  value={draft[field] || ""}
                  onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                  className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
                />
              </label>
            ))}

            <label className="mb-4 block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Amenities
              </span>
              <input
                value={draft.amenities}
                onChange={(event) => setDraft({ ...draft, amenities: event.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              />
            </label>

            <label className="mb-4 block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Photo URLs
              </span>
              <textarea
                value={draft.photos}
                onChange={(event) => setDraft({ ...draft, photos: event.target.value })}
                className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              />
            </label>

            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-slate-500">{status}</p>
              <button
                type="submit"
                disabled={!activeHotelId}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
              >
                Save profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default HotelPartnerDashboard;
