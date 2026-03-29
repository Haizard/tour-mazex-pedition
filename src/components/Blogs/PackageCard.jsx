import { Link } from "react-router-dom";
import { IoLocationSharp, IoTimeOutline, IoPeopleOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import Badge from "../UI/Badge";
import Card from "../UI/Card";

const slugifyTitle = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const PackageCard = (props) => {
  const {
    image,
    title,
    location,
    price,
    description,
    tourType,
    category,
    isGroupTour,
    maxCapacity,
    currentBookings,
    launchDate,
  } = props;
  const spotsLeft = maxCapacity - currentBookings;
  const progress = (currentBookings / maxCapacity) * 100;

  return (
    <Link
      to={`/packages/${slugifyTitle(title)}`}
      onClick={() => window.scrollTo(0, 0)}
      state={props}
      className="group block h-full"
    >
      <Card className="relative h-full border-none shadow-xl hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] transition-all duration-700 rounded-[40px] overflow-hidden bg-white px-0 py-0">
        <div className="relative h-48 md:h-72 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          <div className="absolute top-6 left-6 flex flex-wrap gap-2">
            <Badge variant="luxury" className="backdrop-blur-md bg-white/10 border-white/20 text-white uppercase font-black text-[9px] tracking-widest px-3 py-1">
              {tourType || "Safari"}
            </Badge>
            <Badge variant="secondary" className="backdrop-blur-md bg-primary/20 border-primary/20 text-white uppercase font-black text-[9px] tracking-widest px-3 py-1">
              {category || "Luxury"}
            </Badge>
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-1.5 text-white/90 mb-2">
              <IoLocationSharp className="text-primary text-sm" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {location}
              </span>
            </div>
            <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-primary transition-colors duration-300">
              {title}
            </h3>
          </div>

          <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-white/95 backdrop-blur shadow-xl rounded-2xl px-3 py-1 md:px-4 md:py-2 text-center transform group-hover:scale-110 transition-transform duration-500">
            <p className="text-[7px] md:text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">From</p>
            <p className="text-sm md:text-xl font-black text-primary leading-none">${price}</p>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {isGroupTour && (
            <div className="mb-6 bg-gray-50/50 p-4 rounded-3xl border border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-900 tracking-widest">
                  <IoPeopleOutline className="text-primary text-sm" /> Confirmed Group
                </span>
                <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {spotsLeft} Left
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                />
              </div>
              {launchDate && (
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                  <IoTimeOutline className="text-secondary" /> Starts: {new Date(launchDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          <p className="hidden md:line-clamp-2 text-gray-500 text-sm leading-relaxed font-medium mb-6 opacity-70 group-hover:opacity-100 transition-opacity">
            {description}
          </p>

          <div className="flex justify-between items-center pt-6 border-t border-gray-50">
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">
              View Itinerary
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center transform group-hover:bg-primary group-hover:translate-x-1 transition-all">
              →
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default PackageCard;
