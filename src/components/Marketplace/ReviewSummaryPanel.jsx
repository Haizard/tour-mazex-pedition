const ReviewSummaryPanel = ({ summary }) => {
  const distribution = summary?.ratingDistribution || {};
  const averageRating = summary?.averageRating;
  const reviewCount = Number(summary?.reviewCount || 0);
  const topSentimentTags = summary?.topSentimentTags || [];
  const sentimentHighlights = summary?.sentimentHighlights || [];
  const verificationBreakdown = summary?.verificationBreakdown || {};
  const travelerTypeBreakdown = summary?.travelerTypeBreakdown || [];
  const travelMonthBreakdown = summary?.travelMonthBreakdown || [];

  return (
    <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
            Traveler Reviews
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
            Verified traveler proof
          </h2>
          <div className="mt-5 flex items-end gap-4">
            <span className="text-6xl font-black uppercase tracking-[-0.06em] text-[#224433]">
              {averageRating ?? "--"}
            </span>
            <div className="pb-2">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
                {reviewCount} published review{reviewCount === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Ratings weight verified booking feedback first, then verified inquiry context.
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-[240px] rounded-[28px] bg-[#f8f5ee] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
            Sentiment highlights
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {topSentimentTags.length > 0 ? (
              topSentimentTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#e7f1e7] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#224433]"
                >
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-sm font-medium text-slate-500">
                Sentiment highlights will appear as traveler feedback grows.
              </p>
            )}
          </div>
          {sentimentHighlights.length > 0 ? (
            <div className="mt-4 space-y-2">
              {sentimentHighlights.slice(0, 3).map((tag) => (
                <div key={tag.label} className="flex items-center justify-between text-sm font-medium text-slate-600">
                  <span>{tag.label}</span>
                  <span className="font-black text-slate-900">{tag.count}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-3">
          {[5, 4, 3, 2, 1].map((rating) => {
          const count = Number(distribution[rating] || 0);
          const width = reviewCount > 0 ? `${Math.max((count / reviewCount) * 100, count ? 10 : 0)}%` : "0%";

          return (
            <div key={rating} className="grid grid-cols-[52px_1fr_48px] items-center gap-3">
              <span className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">
                {rating} star
              </span>
              <div className="h-3 overflow-hidden rounded-full bg-[#efe7d7]">
                <div
                  className="h-full rounded-full bg-[#2d6a4f] transition-all"
                  style={{ width }}
                />
              </div>
              <span className="text-right text-sm font-black text-slate-500">{count}</span>
            </div>
          );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[28px] bg-[#f8f5ee] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
              Verification mix
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-white px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Verified bookings</p>
                <p className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900">
                  {Number(verificationBreakdown.booking || 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Verified inquiries</p>
                <p className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900">
                  {Number(verificationBreakdown.inquiry || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] bg-[#f8f5ee] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
              Traveler profile mix
            </p>
            <div className="mt-4 space-y-2">
              {travelerTypeBreakdown.length > 0 ? travelerTypeBreakdown.slice(0, 4).map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-600">
                  <span>{item.label}</span>
                  <span className="font-black text-slate-900">{item.count}</span>
                </div>
              )) : (
                <p className="text-sm font-medium text-slate-500">
                  Traveler type mix will appear once reviews include profile detail.
                </p>
              )}
            </div>
            {travelMonthBreakdown.length > 0 ? (
              <div className="mt-4 border-t border-[#eadfcb] pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Common travel months
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {travelMonthBreakdown.slice(0, 4).map((item) => (
                    <span key={item.label} className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#224433]">
                      {item.label} ({item.count})
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewSummaryPanel;
