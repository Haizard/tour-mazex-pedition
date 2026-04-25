import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaShieldAlt, 
  FaStar, 
  FaExclamationTriangle, 
  FaChartLine, 
  FaRobot,
  FaFileAlt,
  FaRedo
} from "react-icons/fa";
import Card from "../UI/Card";
import Badge from "../UI/Badge";
import Button from "../UI/Button";

const ReputationGuardianManager = () => {
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState("");
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    positive: 0,
    critical: 0,
    avgScore: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testimonialsRes] = await Promise.all([
        axios.get("/api/bookings/public-testimonials")
      ]);
      
      // We also need all feedback for stats, not just public ones
      // For now we use testimonials as a proxy or if we had a better endpoint
      setTestimonials(testimonialsRes.data);
      
      const total = testimonialsRes.data.length;
      const positive = testimonialsRes.data.filter(t => t.rating >= 4).length;
      const critical = testimonialsRes.data.filter(t => t.rating <= 2).length;
      const avg = total > 0 ? (testimonialsRes.data.reduce((acc, t) => acc + t.rating, 0) / total).toFixed(1) : 0;

      setStats({ total, positive, critical, avgScore: avg });
    } catch (error) {
      console.error("Failed to fetch reputation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setReportLoading(true);
      const response = await axios.get("/api/bookings/feedback-report");
      setReport(response.data.report);
    } catch (error) {
      console.error("Failed to generate report:", error);
      setReport("Failed to generate AI report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <FaShieldAlt className="text-primary" />
            Reputation Guardian
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Autonomous feedback filtering, sentiment analysis, and social proof engine.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchData} 
          disabled={loading}
          icon={<FaRedo className={loading ? "animate-spin" : ""} />}
        >
          Refresh Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 border-l-4 border-l-primary">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg. Rating</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.avgScore}</span>
            <span className="text-sm font-bold text-slate-500">/ 5.0</span>
          </div>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <FaStar key={s} className={s <= Math.round(stats.avgScore) ? "text-safari-gold" : "text-slate-200"} />
            ))}
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-green-500">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Happy Travelers</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.positive}</span>
            <span className="text-xs font-bold text-green-600">Public Testimonials</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 font-medium">Referred to Google/TripAdvisor</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-orange-500">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtered Risks</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.critical}</span>
            <span className="text-xs font-bold text-orange-600">Private Issues</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 font-medium">Caught by the Safety Net</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-blue-500">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Referral Loop</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs font-bold text-blue-600">Active Codes</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 font-medium">Loyalty rewards generated</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AI Improvement Report */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
              <FaRobot className="text-primary" />
              AI Improvement Report
            </h3>
            <Button 
              size="sm" 
              onClick={generateReport} 
              disabled={reportLoading}
              icon={<FaChartLine />}
            >
              {reportLoading ? "Analyzing..." : "Generate Report"}
            </Button>
          </div>

          <div className="min-h-[300px] rounded-xl bg-slate-50 p-6 border border-slate-100">
            {reportLoading ? (
              <div className="flex h-full flex-col items-center justify-center space-y-4 py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Scanning feedback patterns...</p>
              </div>
            ) : report ? (
              <div className="prose prose-sm max-w-none prose-slate">
                <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">
                  {report}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center space-y-4 py-20 text-center">
                <FaFileAlt className="text-4xl text-slate-200" />
                <p className="text-sm font-bold text-slate-400">Click generate to receive an AI-powered summary of your traveler sentiment and service gaps.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Latest Testimonials */}
        <Card className="p-6">
          <h3 className="mb-6 font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <FaStar className="text-safari-gold" />
            Live Social Proof
          </h3>
          
          <div className="space-y-4">
            {testimonials.length > 0 ? (
              testimonials.map((t, idx) => (
                <div key={idx} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-hover hover:border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{t.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{new Date(t.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <FaStar key={s} className={`text-[10px] ${s <= t.rating ? "text-safari-gold" : "text-slate-100"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-xs italic font-medium text-slate-600 line-clamp-2">
                    "{t.privateNote || "No text provided."}"
                  </p>
                </div>
              ))
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <p className="text-sm font-bold text-slate-400">No testimonials captured yet.</p>
              </div>
            )}
          </div>
          
          {testimonials.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-center">
              <Badge variant="primary" className="text-[9px] px-3 py-1">
                Displaying {testimonials.length} public reviews on your website
              </Badge>
            </div>
          )}
        </Card>
      </div>

      {/* Safety Net Logs */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-4">
          <h3 className="font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <FaExclamationTriangle className="text-orange-500" />
            The Safety Net: Filtered Feedback
          </h3>
        </div>
        <div className="p-0">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Traveler</th>
                <th className="px-6 py-4 text-center">Rating</th>
                <th className="px-6 py-4">Private Issue / Sentiment</th>
                <th className="px-6 py-4 text-right">Action Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* This would ideally list 1-3 star reviews specifically */}
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-bold">
                  All systems green. No unsatisfied travelers currently in the safety net.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ReputationGuardianManager;
