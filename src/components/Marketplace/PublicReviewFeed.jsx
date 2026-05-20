const PublicReviewFeed = ({ reviews = [] }) => (
  <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
          Community Feedback
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
          Traveler voice on this package
        </h2>
      </div>
      <p className="text-sm font-medium text-slate-500">
        Every published review keeps its verification type visible before you decide to inquire.
      </p>
    </div>

    <div className="mt-6 space-y-4">
      {reviews.length > 0 ? (
        reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-[28px] border border-slate-100 bg-slate-50 p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#224433] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                {review.verificationType === "booking" ? "Verified booking" : "Verified inquiry"}
              </span>
              <span className="rounded-full bg-[#fff0c9] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#7b5d1a]">
                {review.rating}/5
              </span>
              {review.travelMonth ? (
                <span className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {review.travelMonth}
                </span>
              ) : null}
              {review.travelerType ? (
                <span className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {review.travelerType}
                </span>
              ) : null}
            </div>
            <h3 className="mt-4 text-xl font-black uppercase tracking-tight text-slate-900">
              {review.headline || "Traveler review"}
            </h3>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
              {review.reviewBody || "No written review was added."}
            </p>
            {review.submittedAt ? (
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Published {new Date(review.submittedAt).toLocaleDateString()}
              </p>
            ) : null}
            {(review.sentimentTags || []).length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {review.sentimentTags.map((tag) => (
                  <span
                    key={`${review.id}-${tag}`}
                    className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#224433]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-8">
          <p className="text-sm font-medium leading-7 text-slate-600">
            This package does not have public traveler reviews yet. The first verified review will
            appear here after moderation or auto-publish rules allow it.
          </p>
        </div>
      )}
    </div>
  </section>
);

export default PublicReviewFeed;
