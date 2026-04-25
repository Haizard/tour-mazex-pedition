import { useEffect, useState } from "react";
import { FaStar, FaQuoteLeft } from "react-icons/fa";
import { fetchPublicTestimonials } from "../../services/api";

const ReviewWall = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await fetchPublicTestimonials();
        setReviews(response.data);
      } catch (err) {
        console.error("Failed to load testimonials:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, []);

  if (loading) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Stories</p>
    </div>
  );

  if (reviews.length === 0) return null;

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-3">Traveler Voices</p>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
            Stories from the <span className="text-primary italic">Wild</span>
          </h2>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {reviews.map((review, i) => (
            <div 
              key={i} 
              className="break-inside-avoid bg-slate-50 rounded-[40px] p-8 border border-slate-100 hover:border-primary/20 hover:shadow-2xl transition-all duration-500 group"
            >
              <div className="flex gap-1 mb-6 text-amber-400">
                {[...Array(review.rating)].map((_, i) => (
                  <FaStar key={i} />
                ))}
              </div>

              <div className="relative">
                <FaQuoteLeft className="absolute -top-4 -left-2 text-slate-200 text-4xl -z-10 opacity-50" />
                <p className="text-slate-600 font-medium leading-relaxed italic relative z-10">
                  "{review.privateNote || "An incredible experience from start to finish. The team went above and beyond to make our safari unforgettable."}"
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-900">{review.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                    {new Date(review.submittedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FaCheckCircle className="text-xs" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FaCheckCircle = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
);

export default ReviewWall;
