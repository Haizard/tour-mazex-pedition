import { useEffect, useState } from "react";
import { FaChartLine, FaUsers, FaFunnelDollar, FaNetworkWired } from "react-icons/fa";
import { fetchEcosystemIntelligence } from "../../services/api";

import Card from "../UI/Card";
import Badge from "../UI/Badge";

const IntelligenceDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchIntelligence = async () => {
      try {
        const response = await fetchEcosystemIntelligence();
        setData(response.data);
      } catch (err) {
        setError("Failed to load ecosystem intelligence. Ensure PostgreSQL sync is healthy.");
      } finally {
        setLoading(false);
      }
    };
    fetchIntelligence();
  }, []);

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Calculating intelligence...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold">{error}</div>;

  const { funnel, revenue, partners } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Commercial Brain
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Ecosystem Intelligence
          </h2>
        </div>
        <Badge variant="accent">Live Data</Badge>
      </div>

      {/* Top Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Total Inquiries" 
          value={funnel.totalInquiries} 
          icon={<FaUsers />} 
          color="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          label="Conversion Rate" 
          value={funnel.conversionRate} 
          icon={<FaChartLine />} 
          color="bg-emerald-50 text-emerald-600" 
        />
        <StatCard 
          label="Gross Revenue" 
          value={`$${(revenue.totalGross / 1000).toFixed(1)}k`} 
          icon={<FaFunnelDollar />} 
          color="bg-amber-50 text-amber-600" 
        />
        <StatCard 
          label="Active Partners" 
          value={partners.length} 
          icon={<FaNetworkWired />} 
          color="bg-purple-50 text-purple-600" 
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Channel ROI */}
        <Card className="p-8 border-none shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">Channel Performance</h3>
          <div className="space-y-6">
            {revenue.channelBreakdown.map((item) => (
              <div key={item.channel} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-black uppercase tracking-widest text-slate-500">{item.channel}</span>
                  <span className="font-bold text-slate-900">${item.revenue.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: item.marketShare }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Partner Leaderboard */}
        <Card className="p-8 border-none shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">Top Partners</h3>
          <div className="divide-y divide-slate-100">
            {partners.map((partner) => (
              <div key={partner.code} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-bold text-slate-900">{partner.name}</p>
                  <p className="text-xs font-medium text-slate-500">{partner.bookings} bookings attributed</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">${partner.revenue.toLocaleString()}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Total ROI</p>
                </div>
              </div>
            ))}
            {partners.length === 0 && (
              <p className="py-8 text-center text-sm font-medium text-slate-400">No attributed partner revenue yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <Card className="p-6 border-none shadow-lg">
    <div className="flex items-center gap-4">
      <div className={`rounded-2xl p-4 text-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  </Card>
);

export default IntelligenceDashboard;
