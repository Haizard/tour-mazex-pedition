import { useMemo, useState } from "react";

import { getMediaUrl } from "../../services/api";
import Badge from "../UI/Badge";
import Card from "../UI/Card";

const ToggleRow = ({ label, hint, checked, onChange }) => (
  <label className="flex items-start justify-between gap-4 rounded-[24px] border border-slate-100 bg-slate-50 px-5 py-4">
    <div>
      <p className="text-sm font-black uppercase tracking-wide text-slate-900">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{hint}</p>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
    />
  </label>
);

const getModerationBadgeProps = (status = "") => {
  if (status === "approved") {
    return { variant: "primary" };
  }

  if (status === "rejected") {
    return {
      variant: "secondary",
      className: "bg-red-100 text-red-600 border-red-200",
    };
  }

  return { variant: "secondary" };
};

const MarketplaceModerationManager = ({
  settings,
  onSettingsChange,
  onSaveSettings,
  savingSettings = false,
  queue,
  toursById,
  onModerateReview,
  onModeratePhoto,
  onModerateQuestion,
  onAnswerQuestion,
  refreshing = false,
}) => {
  const [answerDrafts, setAnswerDrafts] = useState({});
  const queueSummary = useMemo(
    () => ({
      reviews: (queue?.reviews || []).filter((item) => item.moderationStatus === "pending").length,
      photos: (queue?.photos || []).filter((item) => item.moderationStatus === "pending").length,
      questions: (queue?.questions || []).filter((item) => item.status === "pending").length,
    }),
    [queue],
  );

  return (
    <div className="space-y-8">
      <Card className="border-none p-8 shadow-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Marketplace Trust Desk
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
              Moderation And Community Rules
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
              Control how verified reviews, traveler photos, and public package questions become
              visible on the marketplace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">{queueSummary.reviews} Reviews Pending</Badge>
            <Badge variant="accent">{queueSummary.photos} Photos Pending</Badge>
            <Badge variant="secondary">{queueSummary.questions} Questions Pending</Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ToggleRow
            label="Auto-publish verified booking reviews"
            hint="Approved booking reviews can go public automatically once submitted."
            checked={settings?.autoPublishVerifiedReviews === true}
            onChange={(value) => onSettingsChange?.("autoPublishVerifiedReviews", value)}
          />
          <ToggleRow
            label="Auto-publish traveler questions"
            hint="Traveler questions can appear immediately instead of waiting for manual approval."
            checked={settings?.autoPublishTravelerQuestions === true}
            onChange={(value) => onSettingsChange?.("autoPublishTravelerQuestions", value)}
          />
          <ToggleRow
            label="Require photo moderation"
            hint="Traveler photos stay private until the team approves them for the gallery."
            checked={settings?.requirePhotoModeration !== false}
            onChange={(value) => onSettingsChange?.("requirePhotoModeration", value)}
          />
          <ToggleRow
            label="Include inquiry feedback in ratings"
            hint="Let verified inquiry reviews influence the public marketplace score."
            checked={settings?.includeInquiryFeedbackInRatings === true}
            onChange={(value) => onSettingsChange?.("includeInquiryFeedbackInRatings", value)}
          />
          <ToggleRow
            label="Allow community Q and A"
            hint="Travelers can ask public package questions that operators answer on-marketplace."
            checked={settings?.allowCommunityQnA !== false}
            onChange={(value) => onSettingsChange?.("allowCommunityQnA", value)}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSaveSettings}
            disabled={savingSettings}
            className="rounded-full bg-[#224433] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#173324] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingSettings ? "Saving..." : "Save marketplace rules"}
          </button>
          {refreshing ? (
            <span className="self-center text-sm font-medium text-slate-500">Refreshing moderation queue...</span>
          ) : null}
        </div>
      </Card>

      <Card className="border-none p-8 shadow-xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Review Queue
            </p>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
              Traveler reviews
            </h3>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {(queue?.reviews || []).length > 0 ? (
            queue.reviews.map((review) => (
              <div key={review.id} className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge {...getModerationBadgeProps(review.moderationStatus)}>
                    {review.moderationStatus}
                  </Badge>
                  <Badge variant="accent">{review.verificationType}</Badge>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    {toursById?.[review.tourId]?.title || "Marketplace package"}
                  </span>
                </div>
                <h4 className="mt-4 text-lg font-black uppercase tracking-tight text-slate-900">
                  {review.headline || "Traveler review"}
                </h4>
                <p className="mt-2 text-sm font-medium leading-7 text-slate-600">{review.reviewBody}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onModerateReview?.(review.id, { moderationStatus: "approved", visibilityState: "public" })}
                    className="rounded-full border border-[#224433] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#224433]"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onModerateReview?.(review.id, { moderationStatus: "rejected", visibilityState: "private" })}
                    className="rounded-full border border-red-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm font-medium text-slate-500">
              No traveler reviews are waiting in the moderation queue.
            </p>
          )}
        </div>
      </Card>

      <Card className="border-none p-8 shadow-xl">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Photo Queue
        </p>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
          Traveler gallery submissions
        </h3>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {(queue?.photos || []).length > 0 ? (
            queue.photos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-[28px] border border-slate-100 bg-slate-50">
                {photo.mediaUrl ? (
                  <img src={getMediaUrl(photo.mediaUrl)} alt={photo.caption || "Traveler submission"} className="h-56 w-full object-cover" />
                ) : null}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge {...getModerationBadgeProps(photo.moderationStatus)}>
                      {photo.moderationStatus}
                    </Badge>
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      {toursById?.[photo.tourId]?.title || "Marketplace package"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                    {photo.caption || "No caption provided."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onModeratePhoto?.(photo.id, { moderationStatus: "approved" })}
                      className="rounded-full border border-[#224433] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#224433]"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => onModeratePhoto?.(photo.id, { moderationStatus: "rejected" })}
                      className="rounded-full border border-red-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-600"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm font-medium text-slate-500">
              No traveler photos are waiting in the moderation queue.
            </p>
          )}
        </div>
      </Card>

      <Card className="border-none p-8 shadow-xl">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Q and A Queue
        </p>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
          Traveler questions
        </h3>
        <div className="mt-6 space-y-4">
          {(queue?.questions || []).length > 0 ? (
            queue.questions.map((question) => (
              <div key={question.id} className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge {...getModerationBadgeProps(question.status)}>
                    {question.status}
                  </Badge>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    {toursById?.[question.tourId]?.title || "Marketplace package"}
                  </span>
                </div>
                <h4 className="mt-4 text-lg font-black uppercase tracking-tight text-slate-900">
                  {question.questionBody}
                </h4>

                {(question.answers || []).length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {question.answers.map((answer) => (
                      <div key={answer.id} className="rounded-2xl bg-white px-4 py-4 text-sm font-medium leading-7 text-slate-600">
                        {answer.answerBody}
                      </div>
                    ))}
                  </div>
                ) : null}

                <textarea
                  value={answerDrafts[question.id] || ""}
                  onChange={(event) =>
                    setAnswerDrafts((current) => ({ ...current, [question.id]: event.target.value }))
                  }
                  rows={3}
                  placeholder="Write an operator answer..."
                  className="mt-4 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onModerateQuestion?.(question.id, { status: "approved" })}
                    className="rounded-full border border-[#224433] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#224433]"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onModerateQuestion?.(question.id, { status: "rejected" })}
                    className="rounded-full border border-red-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-600"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const draft = (answerDrafts[question.id] || "").trim();
                      if (!draft) {
                        return;
                      }
                      onAnswerQuestion?.(question.id, draft);
                      setAnswerDrafts((current) => ({ ...current, [question.id]: "" }));
                    }}
                    className="rounded-full bg-[#224433] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white"
                  >
                    Publish answer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm font-medium text-slate-500">
              No traveler questions are waiting in the moderation queue.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MarketplaceModerationManager;
