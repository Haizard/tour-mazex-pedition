import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchTours } from "../../services/api";
import { useRouteData } from "../../utils/routeData.jsx";

const slugifyTitle = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const badgeOptions = [
  { label: "Best Seller", icon: "STAR" },
  { label: "Traveller Choice", icon: "HEART" },
  { label: "Our Choice", icon: "TOP" },
];

const Trending = ({
  variant = "default",
  heading = "Our Popular Expeditions",
  eyebrow = "",
  description = "",
}) => {
  const routeData = useRouteData();
  const sharedData = routeData.shared || {};
  const initialTours = Array.isArray(sharedData.tours)
    ? sharedData.tours.slice(0, 6)
    : [];
  const [tours, setTours] = useState(initialTours);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const navigate = useNavigate();

  useEffect(() => {
    setTours(initialTours);
  }, [sharedData.tours]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadTours = async () => {
      try {
        const res = await fetchTours();
        setTours(res.data.slice(0, 6));
      } catch (error) {
        console.error("Error loading popular expeditions:", error);
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
    navigate(`/packages/${slugifyTitle(item.title)}?tourId=${item._id}`, {
      state: item,
    });
    window.scrollTo(0, 0);
  };

  const visibleTours = (() => {
    if (tours.length === 0) return [];
    const items = [];
    const count = isMobile ? 2 : 3;
    for (let i = 0; i < count; i += 1) {
      items.push(tours[(currentIndex + i) % tours.length]);
    }
    return items;
  })();

  return (
    <div className="py-20 bg-white overflow-hidden">
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-16">
          {eyebrow ? (
            <p className="mb-3 font-oswald text-xs uppercase tracking-[0.3em] text-safari-green">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-signature text-5xl md:text-[78px] text-gray-800 leading-none drop-shadow-sm">
            {heading}
          </h2>
          {description ? (
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              {description}
            </p>
          ) : null}
        </div>

        <div className="relative">
          {variant === "magazine-strip" ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tours.slice(0, 3).map((item, i) => (
                <motion.a
                  key={`${item._id}-${i}`}
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  onClick={() => handleNavigate(item)}
                  className="group relative block h-[420px] overflow-hidden rounded-[28px] cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-900">
                    {badgeOptions[i % badgeOptions.length].label}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="font-heading text-2xl leading-tight md:text-3xl">
                      {item.title}
                    </h3>
                    <div className="mt-4 inline-flex rounded-2xl border border-white/20 bg-white/10 px-4 py-2 font-oswald text-sm uppercase tracking-[0.18em]">
                      From ${item.price}
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          ) : (
            <div className="flex flex-nowrap md:flex-wrap justify-start md:justify-center gap-4 md:gap-8">
              <AnimatePresence mode="popLayout">
                {visibleTours.map((item, i) => (
                  <motion.div
                    key={`${item._id}-${currentIndex}-${i}`}
                    layout
                    initial={false}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-[75vw] sm:w-[60vw] md:w-[300px] lg:w-[340px] shrink-0"
                  >
                    <a
                      onClick={() => handleNavigate(item)}
                      className="group relative block w-full h-[350px] md:h-[400px] rounded-2xl overflow-hidden cursor-pointer transition-transform duration-400 ease-out hover:scale-[1.02]"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-fill transition-transform duration-700"
                      />

                      <div className="absolute inset-0 bg-black/20 transition-colors duration-400 ease-out group-hover:bg-black/40 z-0" />

                      <div className="absolute top-3 right-3 w-[70px] h-[70px] bg-white/90 backdrop-blur-sm text-safari-green rounded-full flex flex-col items-center justify-center text-[9px] font-black uppercase tracking-wider text-center shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-2 border-safari-gold/50 z-20 px-1 leading-[1.1]">
                        <span className="text-[12px] mb-[1px]">
                          {badgeOptions[i % badgeOptions.length].icon}
                        </span>
                        <span className="scale-[0.85] w-[75px] block">
                          {badgeOptions[i % badgeOptions.length].label}
                        </span>
                      </div>

                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4 md:px-6 text-center text-white text-[19px] md:text-[22px] font-bold z-10 leading-snug drop-shadow-[1px_1px_6px_rgba(0,0,0,0.8)]"
                        style={{ textShadow: "1px 1px 6px rgba(0, 0, 0, 0.8)" }}
                      >
                        {item.title}
                      </div>

                      <div className="absolute bottom-3 right-3 text-right z-10">
                        <div className="text-[10px] md:text-[12px] text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          From
                        </div>
                        <div className="mt-1 font-bold text-base md:text-lg text-white border-2 border-white rounded-lg py-1 px-3 inline-block transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-[0_0_6px_2px_rgba(255,255,255,0.6)] backdrop-blur-sm bg-black/30">
                          ${item.price}
                        </div>
                      </div>
                    </a>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <div className="flex justify-center gap-2 mt-12">
            {tours.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 transition-all duration-500 rounded-full ${
                  currentIndex === i
                    ? "w-8 bg-safari-green"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
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
