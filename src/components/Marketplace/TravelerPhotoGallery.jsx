import { getMediaUrl } from "../../services/api";

const TravelerPhotoGallery = ({ photos = [] }) => (
  <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
          Traveler Photos
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
          Community trip moments
        </h2>
      </div>
      <p className="text-sm font-medium text-slate-500">
        Published photos appear after moderation or operator auto-approval.
      </p>
    </div>

    {photos.length > 0 ? (
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] bg-[#f8f5ee] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
            Community gallery
          </p>
          <p className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900">
            {photos.length}
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            Approved traveler moments currently published for this package.
          </p>
        </div>
        <div className="rounded-[28px] bg-[#f8f5ee] p-5 md:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
            Gallery note
          </p>
          <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
            Shared moments help future travelers understand camp atmosphere, wildlife sightings, and the real pace of the journey.
          </p>
        </div>
      </div>
    ) : null}

    {photos.length > 0 ? (
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {photos.map((photo) => (
          <figure
            key={photo._id || photo.id || photo.mediaUrl}
            className="overflow-hidden rounded-[28px] border border-slate-100 bg-slate-50"
          >
            <img
              src={getMediaUrl(photo.mediaUrl)}
              alt={photo.caption || "Traveler submission"}
              className="h-56 w-full object-cover"
            />
            <figcaption className="p-4 text-sm font-medium leading-6 text-slate-600">
              {photo.caption || "Traveler-submitted photo"}
            </figcaption>
          </figure>
        ))}
      </div>
    ) : (
      <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-8">
        <p className="text-sm font-medium leading-7 text-slate-600">
          No public traveler photos are live yet. The first approved photo submission will start the gallery.
        </p>
      </div>
    )}
  </section>
);

export default TravelerPhotoGallery;
