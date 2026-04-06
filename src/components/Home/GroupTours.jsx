import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchTours } from "../../services/api";
import { FaCalendarAlt } from "react-icons/fa";

const slugifyTitle = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const GroupTours = () => {
  const [groupTours, setGroupTours] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadGroupTours = async () => {
      try {
        const res = await fetchTours();
        // Filter out tours that are explicitly marked as group tours in the CMS
        const filteredGroups = res.data.filter((tour) => tour.isGroupTour);
        setGroupTours(filteredGroups);
      } catch (error) {
        console.error("Error loading group tours:", error);
      }
    };
    loadGroupTours();
  }, []);

  const handleItinerary = (item) => {
    navigate(`/packages/${slugifyTitle(item.title)}?tourId=${item._id}`, { state: item });
    window.scrollTo(0, 0);
  };

  const handleBooking = () => {
    // Assuming there is a general contact/booking page
    navigate("/contact");
    window.scrollTo(0, 0);
  };

  // Helper to safely format CMS date strings
  const formatDate = (dateString) => {
    if (!dateString) return "Dates Flexible";
    const date = new Date(dateString);
    if (isNaN(date)) return "Dates Flexible";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  };

  if (groupTours.length === 0) {
    return null; // Do not render section if no group tours are active
  }

  return (
    <div className="bg-white py-16">
      <div className="container px-4 max-w-6xl mx-auto">
        {/* Title Area matching Popular Tours custom header structure */}
        <div className="text-center mb-16 px-4">
          <h2 className="text-4xl md:text-5xl font-heading text-gray-900 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
            <span className="uppercase tracking-wide">Our</span>
            <span className="font-signature text-7xl md:text-[88px] text-safari-green leading-none -mt-4 md:mt-0">
              Group
            </span>
            <span className="uppercase tracking-wide">Tours</span>
          </h2>
        </div>

        {/* Group Tours List Rows */}
        <div className="space-y-6 md:space-y-4">
          {groupTours.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center p-6 border border-gray-100 rounded-[10px] bg-[#fafafa] hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              {/* Col-md-3: Image */}
              <div className="flex justify-center md:justify-start">
                <img
                  src={item.image}
                  alt={item.title}
                  className="rounded-[10px] h-[130px] w-full max-w-[200px] object-fill shadow-sm"
                />
              </div>

              {/* Col-md-3: Price section */}
              <div className="text-center flex flex-col justify-center">
                <h3 className="flex flex-col justify-center font-oswald text-gray-900 uppercase">
                  <span className="text-[28px] font-bold text-safari-green leading-none">
                    ${item.price}
                  </span>
                  <span className="text-[14px] font-bold text-gray-600 mt-1 tracking-widest">
                    per person
                  </span>
                </h3>
              </div>

              {/* Col-md-3: Title and Details */}
              <div className="text-center md:text-left">
                <h3 className="font-heading text-xl md:text-lg lg:text-xl font-semibold text-gray-900 mb-3 leading-tight">
                  {item.title}
                </h3>
                <p className="flex items-center justify-center md:justify-start gap-2 text-[15px] font-medium text-gray-600">
                  <FaCalendarAlt className="text-safari-green" />
                  {formatDate(item.launchDate)}
                </p>
                {/* Optional logic if CMS duration or capacities exist */}
                <span className="text-xs text-gray-400 mt-1 block">
                  Capacity: {item.currentBookings || 0}/{item.maxCapacity || 10}{" "}
                  Booked
                </span>
              </div>

              {/* Col-md-3: Action Buttons */}
              <div className="flex flex-col items-center justify-center gap-3">
                <button
                  onClick={handleBooking}
                  className="w-full max-w-[200px] md:w-[85%] bg-green-700 text-white font-oswald font-medium py-2.5 px-4 rounded hover:bg-green-800 transition-colors uppercase tracking-wider text-sm shadow-md"
                >
                  Book Now
                </button>
                <button
                  onClick={() => handleItinerary(item)}
                  className="w-full max-w-[200px] md:w-[85%] bg-[#8B4513] text-white font-oswald font-medium py-2.5 px-4 rounded hover:bg-[#6e3710] transition-colors uppercase tracking-wider text-sm shadow-md"
                >
                  See Itinerary
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupTours;
