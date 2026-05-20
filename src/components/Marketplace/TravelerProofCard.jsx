import { getTravelerProofSummary } from "./marketplaceTrustUtils";

const TravelerProofCard = ({
  summary = null,
  reviewsEnabled = true,
  travelerPhotosEnabled = true,
  questionsEnabled = true,
  photoCount = 0,
  questionCount = 0,
}) => {
  const travelerSignals = [
    reviewsEnabled ? "reviews" : null,
    travelerPhotosEnabled ? "traveler photos" : null,
    questionsEnabled ? "public questions" : null,
  ].filter(Boolean);

  const verificationBreakdown = summary?.verificationBreakdown || {};
  const bookingCount = Number(verificationBreakdown.booking || 0);
  const inquiryCount = Number(verificationBreakdown.inquiry || 0);

  return (
    <div className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)]">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
        Traveler proof
      </p>
      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-[#f8f5ee] px-4 py-4">
          <p className="text-sm font-black uppercase tracking-wide text-slate-900">
            Published review context
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            {getTravelerProofSummary(summary)}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Verification mix
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-wide text-slate-900">
              {bookingCount} booking / {inquiryCount} inquiry
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Community signals
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-wide text-slate-900">
              {travelerSignals.length > 0 ? travelerSignals.join(" • ") : "Signals currently limited"}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-sm font-black uppercase tracking-wide text-slate-900">
            Extra traveler evidence
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            {photoCount > 0 || questionCount > 0
              ? `${photoCount} traveler photo ${photoCount === 1 ? "entry" : "entries"} and ${questionCount} public ${questionCount === 1 ? "question" : "questions"} currently support this package.`
              : "Traveler photos and public questions will strengthen this package proof story as more travelers engage."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TravelerProofCard;
