import { useEffect, useState } from "react";
import { FaWhatsapp, FaEnvelope, FaHistory, FaCheckCircle } from "react-icons/fa";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  fetchRepeatCustomerCampaigns,
  updateRepeatCustomerCampaign,
} from "../../services/api";

const RepeatCustomerManager = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetchRepeatCustomerCampaigns({ source: "postgres" });
      setCampaigns(response.data);
    } catch (err) {
      console.error("Failed to load repeat customer campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateRepeatCustomerCampaign(id, { status });
      loadCampaigns();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const getSegmentColor = (segment) => {
    switch (segment) {
      case "VIP": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Loyal": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Lapsed": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    filter === "all" ? true : c.segment?.toLowerCase() === filter.toLowerCase()
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            Growth Engine
          </p>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Repeat Customer <span className="text-primary italic">LTV</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-2 max-w-3xl">
            Automatically targeted campaigns for your past travelers. Segmented by loyalty tier
            and travel history to maximize repeat bookings.
          </p>
        </div>
        <div className="flex gap-2">
            {["all", "VIP", "Loyal", "Lapsed"].map(s => (
                <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        filter === s ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                    }`}
                >
                    {s}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-primary animate-spin mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Analyzing Segments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCampaigns.map((campaign) => (
                <Card key={campaign._id} className="p-0 overflow-hidden border-none shadow-xl group">
                    <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400">
                                <FaHistory />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">{campaign.guestName}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{campaign.bookingLabel}</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getSegmentColor(campaign.segment)}`}>
                            {campaign.segment || "First-Timer"}
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-1">Proposed Subject</p>
                            <p className="text-sm font-bold text-slate-800">{campaign.subject}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 text-xs font-medium text-slate-600 leading-relaxed max-h-32 overflow-y-auto scrollbar-hide italic">
                            &quot;{campaign.message}&quot;
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${campaign.status === 'draft' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{campaign.status}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => handleUpdateStatus(campaign._id, 'sent')}
                                    disabled={campaign.status === 'sent'}
                                    variant={campaign.channel === 'whatsapp' ? 'primary' : 'secondary'}
                                    className="px-4 py-2 text-[10px] flex items-center gap-2"
                                >
                                    {campaign.channel === 'whatsapp' ? <FaWhatsapp className="text-sm" /> : <FaEnvelope className="text-sm" />}
                                    Send {campaign.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}
                                </Button>
                                {campaign.status === 'sent' && (
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleUpdateStatus(campaign._id, 'converted')}
                                        className="px-4 py-2 text-[10px] border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                    >
                                        <FaCheckCircle className="mr-1" /> Converted
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            ))}

            {filteredCampaigns.length === 0 && (
                <div className="lg:col-span-2 py-32 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No targetable guests found in this segment.</p>
                    <p className="text-[10px] font-medium text-slate-300 mt-2">The system will automatically generate drafts as bookings are completed.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default RepeatCustomerManager;
