import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchTours } from "../../services/api";
import { FaStar } from "react-icons/fa";

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
    <div className="bg-[#f7f7f7] py-20 pb-24">
      <div className="container px-4">
        {/* Title Area */}
        <div className="text-center mb-16 px-4">
          <h2 className="text-4xl md:text-5xl font-heading text-gray-900 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
            <span className="uppercase tracking-wide">Our</span>
            <span className="font-signature text-7xl md:text-[88px] text-safari-green leading-none lowercase -mt-4 md:mt-0">popular</span>
            <span className="uppercase tracking-wide">Tours</span>
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
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
                className="group relative w-full h-[300px] bg-white rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.03]"
              >
                {/* Image */}
                <div className="absolute inset-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Rating (Top Left) */}
                <div className="absolute top-3 left-3 flex gap-1 text-yellow-400 text-sm drop-shadow-md">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>

                {/* Price (Top Right) */}
                <div className="absolute top-3 right-3 bg-safari-green text-white text-sm font-bold px-3 py-1.5 rounded shadow-lg">
                  from ${item.price}
                </div>

                {/* Title (Bottom Center) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 pb-5 text-center">
                  <h3 className="font-oswald text-white text-[18px] leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
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
