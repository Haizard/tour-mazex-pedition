import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicQuote, respondToPublicQuote } from "../services/api";
import Badge from "../components/UI/Badge";
import Button from "../components/UI/Button";
import Card from "../components/UI/Card";

const QuotePublicView = () => {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responding, setResponding] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState("");

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const response = await fetchPublicQuote(token);
        setQuote(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load your quote. Please check the link or contact us.");
      } finally {
        setLoading(false);
      }
    };
    loadQuote();
  }, [token]);

  const handleResponse = async (action, notes = "") => {
    setResponding(true);
    setError("");
    try {
      const response = await respondToPublicQuote(token, { action, notes });
      setResponseSuccess(action === "accept" ? "Thank you! We have received your acceptance. Our team will contact you shortly to finalize the booking." : "Thank you for your feedback. We will review it and get back to you with an updated proposal.");
      setQuote(response.data?.quote || null);
    } catch (err) {
      setError("Failed to submit your response. Please try again.");
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Preparing your custom itinerary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md p-8 text-center shadow-2xl">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-black uppercase tracking-tight text-slate-900">Oops!</h2>
          <p className="text-sm font-medium text-slate-600">{error}</p>
          <Button className="mt-6 w-full" onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  const isAccepted = quote.status === "accepted";

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-24 pt-12 font-sans selection:bg-primary selection:text-white">
      <div className="container mx-auto max-w-5xl px-4 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-12 text-center" data-aos="fade-up">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
            Exclusive Custom Proposal
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 md:text-5xl lg:text-6xl">
            {quote.title}
          </h1>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Badge variant="accent" className="px-4 py-2 text-xs font-black uppercase tracking-widest">
              {quote.travelerCount} Traveler(s)
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-xs font-black uppercase tracking-widest">
              {quote.tripLengthDays} Days
            </Badge>
            <Badge variant={isAccepted ? "accent" : "secondary"} className="px-4 py-2 text-xs font-black uppercase tracking-widest">
              Status: {quote.status}
            </Badge>
          </div>
        </div>

        {responseSuccess && (
          <div className="mb-12 animate-fade-in rounded-[32px] border border-emerald-100 bg-emerald-50 px-8 py-6 text-center shadow-sm" data-aos="zoom-in">
            <p className="text-sm font-bold text-emerald-800">{responseSuccess}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary */}
            <Card className="border-none p-8 shadow-xl md:p-10" data-aos="fade-up">
              <h3 className="mb-6 text-lg font-black uppercase tracking-widest text-slate-900">
                The Journey Ahead
              </h3>
              <p className="text-lg font-medium leading-relaxed text-slate-600">
                {quote.summary}
              </p>
              
              <div className="mt-10 space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Itinerary Outline</h4>
                <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-slate-100">
                  {quote.itineraryOutline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[27px] top-1.5 h-4 w-4 rounded-full border-4 border-white bg-primary shadow-sm"></div>
                      <p className="text-base font-bold text-slate-800">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Inclusions / Next Steps */}
            <Card className="border-none p-8 shadow-xl md:p-10" data-aos="fade-up" data-aos-delay="100">
              <h3 className="mb-6 text-lg font-black uppercase tracking-widest text-slate-900">
                Your Next Steps
              </h3>
              <ul className="space-y-4">
                {quote.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary/30"></div>
                    <p className="text-sm font-medium text-slate-600">{step}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Pricing Sidebar */}
          <div className="space-y-8 lg:sticky lg:top-8 lg:h-fit">
            <Card className="border-none bg-slate-900 p-8 text-white shadow-2xl md:p-10" data-aos="fade-left">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Total Proposal
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{quote.currency}</span>
                <span className="text-5xl font-black tracking-tighter md:text-6xl">{quote.totalPrice.toLocaleString()}</span>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-400">Includes all taxes and coordination fees</p>
              
              <div className="my-8 h-px bg-white/10"></div>
              
              <div className="space-y-4">
                {quote.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-300">{item.label}</span>
                      <span className="text-[10px] font-bold text-slate-500 italic">{item.notes}</span>
                    </div>
                    <span className="text-sm font-black whitespace-nowrap">{quote.currency} {item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {!isAccepted && !responseSuccess && (
                <div className="mt-10 space-y-3">
                  <Button 
                    className="w-full bg-primary py-4 text-sm font-black uppercase tracking-widest hover:scale-[1.02]"
                    onClick={() => handleResponse("accept")}
                    disabled={responding}
                  >
                    {responding ? "Processing..." : "Accept Proposal"}
                  </Button>
                  <button 
                    className="w-full rounded-2xl border border-white/20 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10"
                    onClick={() => {
                      const notes = prompt("How can we improve this for you?");
                      if (notes) handleResponse("reject", notes);
                    }}
                    disabled={responding}
                  >
                    Request Changes
                  </button>
                </div>
              )}
            </Card>

            <Card className="border-none p-6 shadow-lg md:p-8" data-aos="fade-left" data-aos-delay="200">
              <h4 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-900">Validity</h4>
              <p className="text-sm font-medium text-slate-600">
                This proposal is valid until <span className="font-bold text-slate-900">{new Date(quote.validUntil).toLocaleDateString()}</span>. 
                Prices may fluctuate after this date based on supplier availability.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotePublicView;
