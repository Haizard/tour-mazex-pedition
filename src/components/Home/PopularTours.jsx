import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchTours } from "../../services/api";
import { FaStar } from "react-icons/fa";
import { useRouteData } from "../../utils/routeData.jsx";
import { buildTenantScopedTourPath } from "../../utils/tenantRoutes.js";

const badgeLabels = ["Best Seller", "Traveller Choice", "Our Choice"];

const PopularTours = ({
  variant = "popular-grid",
  prefixLabel = "Our",
  scriptLabel = "popular",
  suffixLabel = "Expeditions",
  introText = "",
  limit = 6,
}) => {
  const routeData = useRouteData();
  const sharedData = routeData.shared || {};
  const initialTours = Array.isArray(sharedData.tours)
    ? sharedData.tours.slice(-Math.max(limit, 1)).reverse()
    : [];
  const [tours, setTours] = useState(initialTours);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setTours(initialTours);
  }, [sharedData.tours, limit]);

  useEffect(() => {
    const loadTours = async () => {
      try {
        const res = await fetchTours();
        // Skip the first 6 used in Top Rated, take the next 6
        setTours(res.data.slice(-Math.max(limit, 1)).reverse()); // Using the last items assuming there are enough in CMS
      } catch (error) {
        console.error("Error loading popular tours:", error);
      }
    };
    loadTours();
  }, [limit]);

  const handleNavigate = (item) => {
    navigate(buildTenantScopedTourPath(item, location.pathname), { state: item });
    window.scrollTo(0, 0);
  };

  return (
    <div className="bg-[#f7f7f7] py-12 md:py-20 pb-16 md:pb-24">
      <div className="container px-4">
        {/* Title Area */}
        <div className="text-center mb-10 md:mb-16 px-4">
          <h2 className="text-3xl md:text-5xl font-heading text-gray-900 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4">
            <span className="uppercase tracking-wide text-2xl md:text-4xl">{prefixLabel}</span>
            <span className="font-signature text-6xl md:text-[88px] text-safari-green leading-none lowercase -mt-2 md:mt-0">{scriptLabel}</span>
            <span className="uppercase tracking-wide text-2xl md:text-4xl">{suffixLabel}</span>
          </h2>
          {introText ? (
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              {introText}
            </p>
          ) : null}
        </div>

        {variant === "featured-list" ? (
          <div className="mx-auto max-w-6xl space-y-4">
            {tours.map((item, index) => (
              <motion.button
                key={item._id}
                type="button"
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                onClick={() => handleNavigate(item)}
                className="grid w-full gap-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-safari-green/50 hover:shadow-xl md:grid-cols-[280px_minmax(0,1fr)] md:p-5"
              >
                <div className="relative h-56 overflow-hidden rounded-[22px]">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-900">
                    {badgeLabels[index % badgeLabels.length]}
                  </div>
                  <div className="absolute bottom-4 left-4 flex gap-1 text-xs text-yellow-400">
                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-safari-green">
                      Signature Journey
                    </p>
                    <h3 className="mt-3 font-heading text-2xl leading-tight text-slate-900 md:text-3xl">
                      {item.title}
                    </h3>
                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600 md:text-base">
                      {item.description ||
                        "A premium itinerary shaped around unforgettable wildlife encounters, thoughtful pacing, and elevated safari moments."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                        Starting From
                      </p>
                      <p className="mt-1 font-oswald text-3xl text-safari-green">
                        ${item.price}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-950 px-5 py-3 font-oswald text-sm uppercase tracking-[0.18em] text-white">
                      View itinerary
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 max-w-7xl mx-auto">
            {tours.map((item, index) => (
              <motion.div
                key={item._id}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex justify-center"
              >
                <div 
                  onClick={() => handleNavigate(item)}
                  className="group relative w-full h-[220px] md:h-[300px] bg-white rounded-xl md:rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-300 transform md:hover:scale-[1.03]"
                >
                  <div className="absolute inset-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-fill transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  <div className="absolute top-2 left-2 md:top-3 md:left-3 flex gap-0.5 md:gap-1 text-yellow-400 text-[10px] md:text-sm drop-shadow-md">
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                  </div>

                  <div className="absolute left-2 top-8 md:left-3 md:top-12 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-lg md:px-3">
                    {badgeLabels[index % badgeLabels.length]}
                  </div>

                  <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-safari-green text-white text-xs md:text-sm font-bold px-2 py-1 md:px-3 md:py-1.5 rounded shadow-lg">
                    from ${item.price}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 pb-3 md:p-4 md:pb-5 text-center">
                    <h3 className="font-oswald text-white text-[13px] md:text-[18px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PopularTours;
