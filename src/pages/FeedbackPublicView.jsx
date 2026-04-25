import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaStar, FaGoogle, FaTripadvisor, FaCheckCircle, FaHeart } from "react-icons/fa";
import { fetchPublicFeedback, submitPublicFeedback } from "../services/api";
import Button from "../components/UI/Button";
import Card from "../components/UI/Card";

const FeedbackPublicView = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [privateNote, setPrivateNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const response = await fetchPublicFeedback(token);
        setFeedback(response.data);
      } catch (err) {
        setError("This feedback link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };
    loadFeedback();
  }, [token]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await submitPublicFeedback(token, {
        rating,
        privateNote,
      });
      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center font-bold uppercase tracking-widest text-slate-400">Loading...</div>;
  if (error) return <div className="flex min-h-screen items-center justify-center text-rose-500 font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-20 font-sans">
      <div className="mx-auto max-w-xl">
        <Card className="overflow-hidden border-none p-0 shadow-2xl rounded-[40px]">
          <div className="bg-slate-900 px-8 py-12 text-center text-white">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary text-3xl">
              <FaHeart />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">How was your trip?</h1>
            <p className="mt-2 text-sm font-medium text-slate-400 uppercase tracking-[0.2em]">Your feedback helps us improve.</p>
          </div>

          <div className="p-8 md:p-12">
            {!submitted ? (
              <div className="space-y-10">
                <div className="flex flex-col items-center gap-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tap to Rate</p>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className={`text-4xl transition-all duration-200 transform ${
                          (hoverRating || rating) >= star ? "scale-125 text-amber-400" : "text-slate-200"
                        }`}
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-sm font-bold text-slate-600 animate-in fade-in zoom-in-95">
                      {rating === 5 ? "Loved it! 🦁" : rating === 4 ? "Great experience! ✨" : "It was okay. 👍"}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Any specific details?</p>
                  <textarea
                    value={privateNote}
                    onChange={(e) => setPrivateNote(e.target.value)}
                    placeholder="Tell us about the highlights or anything we can improve..."
                    className="h-32 w-full rounded-3xl border-slate-100 bg-slate-50 p-6 text-sm font-medium text-slate-900 focus:border-primary focus:ring-primary placeholder:text-slate-300"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  className="w-full py-6 text-sm"
                >
                  {submitting ? "Sending..." : "Submit My Feedback"}
                </Button>
              </div>
            ) : (
              <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 text-4xl">
                  <FaCheckCircle />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Thank you!</h2>
                
                {rating >= 4 ? (
                  <div className="mt-8 space-y-8">
                    <p className="text-sm font-medium leading-relaxed text-slate-500">
                      We're thrilled you had a great experience! Since you loved your trip, would you mind sharing your story publicly? It helps travelers like you find us.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <a
                        href="#"
                        className="flex items-center justify-center gap-3 rounded-2xl bg-white border-2 border-slate-100 p-4 font-black uppercase tracking-widest text-slate-900 hover:border-primary hover:text-primary transition-all"
                      >
                        <FaGoogle className="text-rose-500" /> Google
                      </a>
                      <a
                        href="#"
                        className="flex items-center justify-center gap-3 rounded-2xl bg-white border-2 border-slate-100 p-4 font-black uppercase tracking-widest text-slate-900 hover:border-primary hover:text-primary transition-all"
                      >
                        <FaTripadvisor className="text-emerald-500" /> TripAdvisor
                      </a>
                    </div>

                    <div className="rounded-[32px] bg-primary/5 p-8 border border-primary/10">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-3">Referral Reward</p>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed mb-6">
                        Share this code with your friends. If they book a trip, you both get <span className="font-bold text-primary">$100 Safari Credit!</span>
                      </p>
                      <div className="bg-white rounded-2xl py-4 font-mono text-2xl font-black tracking-widest text-primary border-2 border-dashed border-primary/20">
                        {token.substring(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8">
                    <p className="text-sm font-medium leading-relaxed text-slate-500">
                      We've received your feedback. Our manager will review this privately and reach out to you if needed to make things right. We appreciate your honesty.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
        
        <p className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
          Powered by TourMaze
        </p>
      </div>
    </div>
  );
};

export default FeedbackPublicView;
