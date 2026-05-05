import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaMapMarkerAlt, FaMoneyBillWave } from "react-icons/fa";

const GlobalDiscovery = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: "",
    location: "",
    maxPrice: "",
  });

  const fetchTours = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.q) queryParams.append("q", filters.q);
      if (filters.location) queryParams.append("location", filters.location);
      if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);

      // We use the absolute path in case this is loaded on a different subdomain
      const apiUrl = import.meta.env.VITE_SITE_URL 
        ? `${import.meta.env.VITE_SITE_URL}/api/discovery/tours?${queryParams.toString()}`
        : `/api/discovery/tours?${queryParams.toString()}`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch tours");
      const data = await res.json();
      setTours(data.tours || []);
    } catch (error) {
      console.error("Discovery error:", error);
    } finally {
      setLoading(false);
    }
  }, [filters.location, filters.maxPrice, filters.q]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pt-20">
      {/* Hero Section */}
      <div className="relative bg-[#17331c] py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-6">
            Discover Your Next Adventure
          </h1>
          <p className="text-white/80 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10">
            Browse world-class safari tours, trekking packages, and cultural experiences from verified operators across the MAZ Ecosystem.
          </p>

          {/* Search Bar */}
          <div className="bg-white p-2 md:p-3 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row gap-3 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center bg-slate-50 rounded-xl md:rounded-full px-5 py-3">
              <FaSearch className="text-slate-400 mr-3" />
              <input 
                type="text" 
                name="q"
                value={filters.q}
                onChange={handleFilterChange}
                placeholder="Search tours, parks, animals..." 
                className="bg-transparent w-full outline-none text-slate-800 font-bold placeholder-slate-400"
              />
            </div>
            <div className="flex-1 flex items-center bg-slate-50 rounded-xl md:rounded-full px-5 py-3">
              <FaMapMarkerAlt className="text-slate-400 mr-3" />
              <input 
                type="text" 
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Where to?" 
                className="bg-transparent w-full outline-none text-slate-800 font-bold placeholder-slate-400"
              />
            </div>
            <div className="flex-1 flex items-center bg-slate-50 rounded-xl md:rounded-full px-5 py-3">
              <FaMoneyBillWave className="text-slate-400 mr-3" />
              <input 
                type="number" 
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max Price ($)" 
                className="bg-transparent w-full outline-none text-slate-800 font-bold placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              {loading ? "Searching..." : `${tours.length} Experiences Found`}
            </h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
              Curated from verified partners
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-[24px] h-[400px] shadow-sm border border-slate-100"></div>
            ))}
          </div>
        ) : tours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <Link 
                key={tour._id} 
                to={`/discover/tour/${tour._id}`}
                className="group flex flex-col bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
              >
                <div className="relative h-60 overflow-hidden">
                  <img 
                    src={tour.image} 
                    alt={tour.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900">
                    {tour.tenantId?.name || "Global Network"}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {tour.duration || "Multi-day"}
                    </span>
                    <span className="text-xs font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100">
                      ${tour.price}
                    </span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2 line-clamp-2">
                    {tour.title}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2">
                    {tour.description}
                  </p>
                  <div className="mt-auto flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-wide gap-4">
                    <span className="flex items-center gap-1.5"><FaMapMarkerAlt /> {tour.location}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 border-dashed">
            <h3 className="text-xl font-black uppercase text-slate-400 mb-2">No tours found</h3>
            <p className="text-slate-500 font-medium">Try adjusting your search filters to see more results.</p>
            <button 
              onClick={() => setFilters({ q: "", location: "", maxPrice: "" })}
              className="mt-6 px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalDiscovery;
