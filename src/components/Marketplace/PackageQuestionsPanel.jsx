import { useState } from "react";

import { createMarketplaceQuestion } from "../../services/api";
import { getMarketplaceTravelerSessionKey } from "./travelerSession";

const defaultForm = {
  email: "",
  inquiryId: "",
  questionBody: "",
};

const PackageQuestionsPanel = ({
  questions = [],
  tenantId = "",
  tourId = "",
  communityEnabled = true,
  onSubmitted,
}) => {
  const [formData, setFormData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!communityEnabled) {
      setStatus("This operator has disabled public package questions for now.");
      return;
    }
    if (!tenantId || !tourId) {
      setStatus("This package is missing operator routing details.");
      return;
    }

    setSubmitting(true);
    setStatus("");

    try {
      await createMarketplaceQuestion({
        tenantId,
        tourId,
        sessionKey: getMarketplaceTravelerSessionKey(),
        email: formData.email,
        inquiryId: formData.inquiryId,
        questionBody: formData.questionBody,
      });
      setFormData(defaultForm);
      setStatus("Your question was sent. It will appear once the operator's publication rules allow it.");
      onSubmitted?.();
    } catch (error) {
      setStatus(error?.response?.data?.message || "Unable to submit the question right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
            Community Q and A
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
            Ask the operator
          </h2>
        </div>
        <p className="text-sm font-medium text-slate-500">
          Public answers stay tied to the operator who owns this package.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {questions.length > 0 ? (
          questions.map((question) => (
            <article
              key={question.id}
              className="rounded-[28px] border border-slate-100 bg-slate-50 p-5"
            >
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                {question.questionBody}
              </h3>
              <div className="mt-4 space-y-3">
                {(question.answers || []).length > 0 ? (
                  question.answers.map((answer) => (
                    <div key={answer.id} className="rounded-2xl bg-white px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7451]">
                        {answer.accepted ? "Featured answer" : "Operator reply"}
                      </p>
                      <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                        {answer.answerBody}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-slate-500">
                    This question is still waiting for an operator reply.
                  </p>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-8">
            <p className="text-sm font-medium leading-7 text-slate-600">
              No public marketplace questions have been published for this package yet.
            </p>
          </div>
        )}
      </div>

      <form className="mt-8 space-y-4 rounded-[28px] bg-[#fbf8f1] p-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Email
            </span>
            <input
              type="email"
              value={formData.email}
              onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Inquiry reference
            </span>
            <input
              value={formData.inquiryId}
              onChange={(event) => setFormData((current) => ({ ...current, inquiryId: event.target.value }))}
              placeholder="Optional"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Your question
          </span>
          <textarea
            value={formData.questionBody}
            onChange={(event) => setFormData((current) => ({ ...current, questionBody: event.target.value }))}
            required
            rows={4}
            className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !communityEnabled}
          className="rounded-full bg-[#224433] px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-white transition hover:bg-[#173324] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Ask question"}
        </button>
        {status ? <p className="text-sm font-medium text-slate-600">{status}</p> : null}
      </form>
    </section>
  );
};

export default PackageQuestionsPanel;

