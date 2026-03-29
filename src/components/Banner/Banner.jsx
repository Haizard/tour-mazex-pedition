import React from "react";
import TravelImg from "../../assets/camp1.jpg";
import { MdFlight, MdOutlineLocalHotel } from "react-icons/md";
import { IoIosWifi } from "react-icons/io";
import { IoFastFoodSharp } from "react-icons/io5";
import { Link } from "react-router-dom";

const amenities = [
  {
    icon: <IoIosWifi className="text-2xl text-primary" />,
    label: "Wi-Fi Included",
  },
  {
    icon: <MdOutlineLocalHotel className="text-2xl text-secondary" />,
    label: "Premium Hotels",
  },
  {
    icon: <IoFastFoodSharp className="text-2xl text-primary" />,
    label: "Local Cuisine",
  },
  {
    icon: <MdFlight className="text-2xl text-secondary" />,
    label: "Flight Transfers",
  },
];

const Banner = () => {
  return (
    <div className="bg-slate-900 py-24">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Image section */}
          <div className="relative pb-6 pr-6">
            <div className="absolute -inset-4 bg-primary/10 rounded-[40px] blur-2xl" />
            <img
              src={TravelImg}
              alt="Tanzania Adventure"
              className="relative z-10 w-full h-[420px] object-cover rounded-[32px] shadow-2xl"
            />
            <div className="absolute bottom-0 right-0 z-20 bg-secondary text-white p-5 rounded-2xl shadow-xl border border-secondary/20">
              <p className="font-black text-2xl leading-none">500+</p>
              <p className="text-xs font-bold uppercase tracking-widest mt-1 text-white/90">
                Happy Adventurers
              </p>
            </div>
          </div>

          {/* Text content */}
          <div className="text-white space-y-8">
            <div>
              <p className="text-primary font-bold uppercase tracking-widest text-sm mb-3">
                All-Inclusive Adventures
              </p>
              <h2 className="text-4xl md:text-5xl font-black font-heading leading-tight text-white">
                Explore Every Corner of Tanzania
              </h2>
            </div>
            <p className="text-slate-300 leading-relaxed font-medium">
              Discover breathtaking landscapes, vibrant wildlife, and unique
              cultural experiences. Our tailored journeys offer unparalleled
              adventures, exceptional service, and unforgettable memories.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {amenities.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  {a.icon}
                  <span className="font-bold text-sm text-gray-300">
                    {a.label}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/packages"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-flex items-center gap-2 bg-primary text-white font-black px-8 py-4 rounded-full uppercase tracking-widest text-sm hover:opacity-90 transition cinematic-shadow"
            >
              Browse All Packages →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
