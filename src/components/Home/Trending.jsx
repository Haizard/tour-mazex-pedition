import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchTours } from "../../services/api";

const Trending = () => {
  const [tours, setTours] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTours = async () => {
      try {
        const res = await fetchTours();
        // Get the first 6 latest tours for top rated
        setTours(res.data.slice(0, 6));
      } catch (error) {
        console.error("Error loading top rated tours:", error);
      }
    };
    loadTours();
  }, []);

  useEffect(() => {
    if (tours.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tours.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tours]);

  const handleNavigate = (item) => {
    navigate(`/packages/${item.title}`, { state: item });
    window.scrollTo(0, 0);
  };

  const getVisibleTours = () => {
    if (tours.length === 0) return [];
    const items = [];
    for (let i = 0; i < 3; i++) {
      items.push(tours[(currentIndex + i) % tours.length]);
    }
    return items;
  };

  const visibleTours = getVisibleTours();

  return (
    <div className="py-20 bg-white overflow-hidden">
      <div className="container px-4">
        {/* Title area mapped to the EmmlouSignature "Top Rated Tours" */}
        <div className="text-center mb-16">
          <h2 className="font-signature text-6xl md:text-[78px] text-gray-800 leading-none drop-shadow-sm">
            Top Rated Tours
          </h2>
        </div>

        <div className="relative">
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <AnimatePresence mode="popLayout">
              {visibleTours.map((item, i) => (
                <motion.div
                  key={`${item._id}-${currentIndex}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full sm:w-[90%] md:w-[300px] lg:w-[340px]"
                >
                  {/* Card imitating .highlighted-product */}
                  <a
                    onClick={() => handleNavigate(item)}
                    className="group relative block w-full h-[350px] md:h-[400px] rounded-2xl overflow-hidden cursor-pointer transition-transform duration-400 ease-out hover:scale-[1.02]"
                  >
                    {/* Background Image */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
                    />
                    
                    {/* Dark Overlay mapped from highlighted-product::before */}
                    <div className="absolute inset-0 bg-black/20 transition-colors duration-400 ease-out group-hover:bg-black/40 z-0" />

                    {/* Badge (bestseller/travelerschoice) - mapped as text badge */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[70px] h-[70px] bg-white/90 backdrop-blur-sm text-safari-green rounded-full flex flex-col items-center justify-center text-[10px] font-extrabold uppercase tracking-widest text-center shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-2 border-safari-gold/50 z-20">
                      <span className="text-[18px] mb-[-4px]">🏆</span>
                      <span className="leading-tight scale-90">{item.tourType || "Top"}</span>
                    </div>

                    {/* Title mapped from highlighted-product-title */}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-6 text-center text-white text-xl md:text-[22px] font-bold z-10 leading-snug drop-shadow-[1px_1px_6px_rgba(0,0,0,0.8)]"
                      style={{ textShadow: "1px 1px 6px rgba(0, 0, 0, 0.8)" }}
                    >
                      {item.title}
                    </div>

                    {/* Price mapped from highlighted-product-price */}
                    <div className="absolute bottom-3 right-3 text-right z-10">
                      <div className="text-[12px] text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">From</div>
                      <div className="mt-1 font-bold text-lg text-white border-2 border-white rounded-lg py-1 px-3 inline-block transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-[0_0_6px_2px_rgba(255,255,255,0.6)] backdrop-blur-sm bg-black/30">
                        ${item.price}
                      </div>
                    </div>
                  </a>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-12">
            {tours.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 transition-all duration-500 rounded-full ${
                  currentIndex === i ? "w-8 bg-safari-green" : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trending;
