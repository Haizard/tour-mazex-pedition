import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchTours } from "../../services/api";
import { FaStar } from "react-icons/fa";

const badgeLabels = ["Best Seller", "Traveller Choice", "Our Choice"];

const slugifyTitle = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const PopularTours = () => {
  const [tours, setTours] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTours = async () => {
      try {
        const res = await fetchTours();
        // Skip the first 6 used in Top Rated, take the next 6
        setTours(res.data.slice(-6).reverse()); // Using the last 6 items assuming there are enough in CMS
      } catch (error) {
        console.error("Error loading popular tours:", error);
      }
    };
    loadTours();
  }, []);

  const handleNavigate = (item) => {
    navigate(`/packages/${slugifyTitle(item.title)}?tourId=${item._id}`, { state: item });
    window.scrollTo(0, 0);
  };

  return (
    <div className="bg-[#f7f7f7] py-12 md:py-20 pb-16 md:pb-24">
      <div className="container px-4">
        {/* Title Area */}
        <div className="text-center mb-10 md:mb-16 px-4">
          <h2 className="text-3xl md:text-5xl font-heading text-gray-900 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4">
            <span className="uppercase tracking-wide text-2xl md:text-4xl">Our</span>
            <span className="font-signature text-6xl md:text-[88px] text-safari-green leading-none lowercase -mt-2 md:mt-0">popular</span>
            <span className="uppercase tracking-wide text-2xl md:text-4xl">Expeditions</span>
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 max-w-7xl mx-auto">
          {tours.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex justify-center"
            >
              <div 
                onClick={() => handleNavigate(item)}
                className="group relative w-full h-[220px] md:h-[300px] bg-white rounded-xl md:rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-300 transform md:hover:scale-[1.03]"
              >
                {/* Image */}
                <div className="absolute inset-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-fill transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                </div>

                {/* Rating (Top Left) */}
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

                {/* Price (Top Right) */}
                <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-safari-green text-white text-xs md:text-sm font-bold px-2 py-1 md:px-3 md:py-1.5 rounded shadow-lg">
                  from ${item.price}
                </div>

                {/* Title (Bottom Center) */}
                <div className="absolute bottom-0 left-0 right-0 p-3 pb-3 md:p-4 md:pb-5 text-center">
                  <h3 className="font-oswald text-white text-[13px] md:text-[18px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">
                    {item.title}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularTours;
