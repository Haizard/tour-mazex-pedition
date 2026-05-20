import {
  getDepartureConfidenceCopy,
  getDepartureConfidenceTone,
} from "./marketplaceTrustUtils";

const DepartureConfidenceBadge = ({ entry, className = "" }) => {
  const tone = getDepartureConfidenceTone(entry);
  const copy = getDepartureConfidenceCopy(entry);

  return (
    <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${tone} ${className}`.trim()}>
      {copy}
    </div>
  );
};

export default DepartureConfidenceBadge;
