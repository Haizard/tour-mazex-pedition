import React, { useEffect, useState } from "react";
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

const GroupTours = ({
  prefixLabel = "Our",
  scriptLabel = "Group",
  suffixLabel = "Tours",
  bookingLabel = "Book Now",
  itineraryLabel = "See Itinerary",
  capacityLabel = "Capacity",
}) => {
  const [groupTours, setGroupTours] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadGroupTours = async () => {
      try {
        const res = await fetchTours();
        setGroupTours(res.data.filter((tour) => tour.isGroupTour));
      } catch (error) {
        console.error("Error loading group tours:", error);
      }
    };
    loadGroupTours();
  }, []);

  const handleItinerary = (item) => {
    navigate(`/packages/${slugifyTitle(item.title)}?tourId=${item._id}`, {
      state: item,
    });
    window.scrollTo(0, 0);
  };

  const handleBooking = () => {
    navigate("/contact");
    window.scrollTo(0, 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Dates Flexible";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Dates Flexible";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  };

  if (groupTours.length === 0) {
    return null;
  }

  return (
    <div className="bg-white py-12 md:py-16">
      <div className="container px-4 max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16 px-4">
          <h2 className="text-3xl md:text-5xl font-heading text-gray-900 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4">
            <span className="uppercase tracking-wide text-2xl md:text-4xl">
              {prefixLabel}
            </span>
            <span className="font-signature text-6xl md:text-[88px] text-safari-green leading-none -mt-2 md:mt-0">
              {scriptLabel}
            </span>
            <span className="uppercase tracking-wide text-2xl md:text-4xl">
              {suffixLabel}
            </span>
          </h2>
        </div>

        <div className="space-y-4 md:space-y-4">
          {groupTours.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group flex flex-col md:flex-row gap-4 md:gap-6 items-stretch p-4 md:p-4 border border-transparent rounded-2xl md:rounded-[20px] bg-[#f4fbf6] hover:bg-white hover:border-safari-green hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 border-[2px] border-safari-green/30 rounded-[20px] animate-pulse pointer-events-none z-0" />

              <div className="flex-shrink-0 w-full md:w-[240px] h-[200px] md:h-[160px] relative rounded-xl md:rounded-[16px] overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10" />
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute bottom-0 right-0 bg-safari-green/95 backdrop-blur shadow-lg text-white py-1.5 px-3 md:py-2 md:px-4 rounded-tl-[16px] md:rounded-tl-[20px] z-20 flex flex-col items-center justify-center transform group-hover:bg-safari-green transition-colors">
                  <span className="text-[9px] md:text-[10px] uppercase tracking-wider font-semibold text-green-100 mb-0.5">
                    Starting From
                  </span>
                  <span className="text-xl md:text-2xl font-oswald font-bold leading-none mb-0.5 tracking-wide">
                    ${item.price}
                  </span>
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-green-100">
                    per person
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center py-2 md:py-4 px-2 md:px-0 text-center md:text-left">
                <h3 className="font-heading text-lg lg:text-2xl font-bold text-gray-900 leading-tight group-hover:text-safari-green transition-colors">
                  {item.title}
                </h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                  <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold tracking-wide">
                    <FaCalendarAlt className="text-sm" />
                    {formatDate(item.launchDate)}
                  </span>
                  <span className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold tracking-wide">
                    {capacityLabel}: {item.currentBookings || 0}/{item.maxCapacity || 10}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col justify-center items-center gap-2 md:gap-3 md:w-[180px] md:border-l md:border-gray-100 md:pl-6 py-2 md:py-4">
                <button
                  onClick={handleBooking}
                  className="w-full sm:flex-1 md:w-full bg-green-700 text-white font-oswald font-medium py-3 md:py-2.5 px-4 rounded-xl md:rounded-[8px] hover:bg-green-800 transition-colors uppercase tracking-widest text-[13px] md:text-sm shadow-sm"
                >
                  {bookingLabel}
                </button>
                <button
                  onClick={() => handleItinerary(item)}
                  className="w-full sm:flex-1 md:w-full bg-[#8B4513] text-white font-oswald font-medium py-3 md:py-2.5 px-4 rounded-xl md:rounded-[8px] hover:bg-[#6e3710] transition-colors uppercase tracking-widest text-[13px] md:text-sm shadow-sm"
                >
                  {itineraryLabel}
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
