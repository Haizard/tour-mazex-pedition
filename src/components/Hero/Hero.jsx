import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
const MainVideo = "/videos/main.mp4";

const Hero = ({
  eyebrow = "Karibu Maz",
  headlineScript = "Expeditions",
  description = "",
  primaryCtaLabel = "START PLANNING NOW",
  primaryCtaHref = "/plan-my-trip",
  secondaryCtaLabel = "Explore All Packages",
  secondaryCtaHref = "/packages",
  videoUrl = "",
}) => {
  const navigate = useNavigate();

  const handleStartPlanning = () => {
    navigate(primaryCtaHref);
    window.scrollTo(0, 0);
  };

  return (
    <div className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Cinematic Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={videoUrl || MainVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-slate-900" />
      </div>

      <div className="container relative z-20 text-center text-white px-4 pt-20">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Elegance Heading */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-12"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-light tracking-[0.3em] uppercase mb-4 text-white/90 drop-shadow-xl">
              {eyebrow}
            </h1>
            <div className="font-signature text-safari-gold text-6xl sm:text-8xl lg:text-9xl px-4 pb-4 -mt-4 drop-shadow-2xl transform">
              {headlineScript}
            </div>
            {description && (
              <p className="text-white/80 font-medium text-lg max-w-2xl mx-auto mt-4 leading-relaxed">
                {description}
              </p>
            )}
          </motion.div>

          {/* New CTA Button Replacement for Search Engine */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <button
              onClick={handleStartPlanning}
              className="group relative bg-safari-green text-white px-12 py-5 rounded-xl font-oswald font-bold text-xl uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 hover:bg-safari-gold hover:text-black overflow-hidden active:scale-95"
            >
              <span className="relative z-10">{primaryCtaLabel}</span>
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
            </button>
            
            <Link to={secondaryCtaHref} className="text-white/80 font-oswald text-sm uppercase tracking-widest hover:text-safari-gold transition-colors underline underline-offset-8 decoration-white/20 hover:decoration-safari-gold">
              {secondaryCtaLabel}
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/40 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] font-oswald font-bold">Scroll</span>
        <div className="w-[1px] h-16 bg-gradient-to-b from-safari-gold to-transparent" />
      </motion.div>
    </div>
  );
};

export default Hero;
