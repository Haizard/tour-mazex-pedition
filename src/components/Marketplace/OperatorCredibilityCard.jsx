import {
  getDepartureConfidenceCopy,
  getOperatorTrustLabel,
  getOperatorTrustSupportCopy,
} from "./marketplaceTrustUtils";

const OperatorCredibilityCard = ({
  tour,
  selectedAvailabilityEntry = null,
  selectedAvailabilityLabel = "",
}) => (
  <div className="rounded-[36px] border border-[#e4d6be] bg-[#fbf8f1] p-6 shadow-[0_18px_60px_rgba(35,66,50,0.06)]">
    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
      Operator credibility
    </p>
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl bg-white px-4 py-4">
        <p className="text-sm font-black uppercase tracking-wide text-slate-900">
          {getOperatorTrustLabel(tour)}
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
          {getOperatorTrustSupportCopy(tour)}
        </p>
      </div>
      <div className="rounded-2xl bg-white px-4 py-4">
        <p className="text-sm font-black uppercase tracking-wide text-slate-900">
          Marketplace-active listing
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
          {tour?.isMarketplaceVisible
            ? "This package is currently published on the marketplace and can accept traveler inquiries from this page."
            : "This package is visible here for review, but active marketplace status is not fully confirmed."}
        </p>
      </div>
      <div className="rounded-2xl bg-white px-4 py-4">
        <p className="text-sm font-black uppercase tracking-wide text-slate-900">
          Departure confidence
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
          {selectedAvailabilityEntry
            ? `${selectedAvailabilityLabel}: ${getDepartureConfidenceCopy(selectedAvailabilityEntry)}`
            : "Ask the listed operator for the next confirmed departure window if no published date fits your plans."}
        </p>
      </div>
    </div>
  </div>
);

export default OperatorCredibilityCard;
