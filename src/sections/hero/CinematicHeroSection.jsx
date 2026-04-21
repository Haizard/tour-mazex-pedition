import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Hero from "../../components/Hero/Hero";
import KiliImg from "../../assets/Kilimanjaro.jpg";
import SafariImg from "../../assets/momentlion.jpg";
import CampImg from "../../assets/camp1.jpg";
import TemboImg from "../../assets/tembo.jpg";

const defaultHeroSlides = [KiliImg, SafariImg, CampImg, TemboImg];

const CinematicHeroSection = ({
  variant = "cinematic",
  eyebrow,
  headlineScript,
  description,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  panelEyebrow,
  panelTitle,
  panelBody,
  panelHighlights,
  imageSlides,
  videoUrl,
}) => {
  const safeSlides =
    Array.isArray(imageSlides) && imageSlides.filter(Boolean).length > 0
      ? imageSlides.filter(Boolean)
      : defaultHeroSlides;
  const [activeSlide, setActiveSlide] = React.useState(0);

  React.useEffect(() => {
    if (variant !== "image-slideshow" || safeSlides.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % safeSlides.length);
    }, 22000);

    return () => window.clearInterval(interval);
  }, [safeSlides, variant]);

  if (variant === "image-slideshow") {
    return (
      <section className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          {safeSlides.map((slide, index) => (
            <div
              key={`${slide}-${index}`}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1800ms] ${
                activeSlide === index ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url('${slide}')` }}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,6,23,0.82),rgba(2,6,23,0.36),rgba(2,6,23,0.78))]" />
        </div>

        <div className="container relative z-10 flex min-h-screen items-center px-4 py-24">
          <div className="max-w-3xl">
            <motion.p
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mb-4 font-oswald text-xs uppercase tracking-[0.35em] text-safari-gold/90"
            >
              {eyebrow || "Curated African Journeys"}
            </motion.p>

            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
              className="font-heading text-5xl leading-[0.95] text-white md:text-7xl"
            >
              {headlineScript || "Expeditions"}
            </motion.h1>

            <motion.p
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="mt-6 max-w-2xl text-sm leading-8 text-white/82 md:text-lg"
            >
              {description ||
                "Rotate through destination imagery when you want the homepage to feel calmer than video, but more immersive than a single still hero."}
            </motion.p>

            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <Link
                to={primaryCtaHref || "/plan-my-trip"}
                className="inline-flex items-center justify-center rounded-2xl bg-safari-gold px-8 py-4 font-oswald text-sm uppercase tracking-[0.2em] text-slate-950 shadow-2xl shadow-black/20 transition hover:bg-white"
              >
                {primaryCtaLabel || "Start Planning"}
              </Link>
              <Link
                to={secondaryCtaHref || "/packages"}
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-8 py-4 font-oswald text-sm uppercase tracking-[0.2em] text-white transition hover:border-safari-gold hover:text-safari-gold"
              >
                {secondaryCtaLabel || "Explore Packages"}
              </Link>
            </motion.div>

            <div className="mt-10 flex items-center gap-3">
              {safeSlides.map((slide, index) => (
                <button
                  key={`hero-slide-dot-${slide}-${index}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    activeSlide === index
                      ? "w-10 bg-safari-gold"
                      : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Show hero slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "split-panel") {
    return (
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(215,179,91,0.22),_transparent_30%),linear-gradient(135deg,_#07211e_0%,_#0d3b35_45%,_#133028_100%)] text-white">
        <div className="absolute inset-0 opacity-20">
          <video
            key={videoUrl || "/videos/main.mp4"}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          >
            <source src={videoUrl || "/videos/main.mp4"} type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(3,7,18,0.82),rgba(3,7,18,0.45),rgba(3,7,18,0.78))]" />

        <div className="container relative z-10 px-4 py-20 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_380px] lg:items-center">
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <p className="mb-4 font-oswald text-xs uppercase tracking-[0.35em] text-safari-gold/90">
                {eyebrow || "Design Better Journeys"}
              </p>
              <h1 className="text-5xl font-heading font-semibold leading-[0.95] text-white md:text-7xl">
                {headlineScript || "Expeditions"}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 md:text-lg">
                {description ||
                  "Turn inquiry volume into curated itineraries with a destination-first homepage that feels premium from the first scroll."}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  to={primaryCtaHref || "/plan-my-trip"}
                  className="inline-flex items-center justify-center rounded-2xl bg-safari-gold px-8 py-4 font-oswald text-sm uppercase tracking-[0.2em] text-slate-950 shadow-2xl shadow-black/20 transition hover:bg-white"
                >
                  {primaryCtaLabel || "Start Planning"}
                </Link>
                <Link
                  to={secondaryCtaHref || "/packages"}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-8 py-4 font-oswald text-sm uppercase tracking-[0.2em] text-white transition hover:border-safari-gold hover:text-safari-gold"
                >
                  {secondaryCtaLabel || "Explore Packages"}
                </Link>
              </div>
            </motion.div>

            <motion.aside
              initial={false}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="rounded-[28px] border border-white/12 bg-white/10 p-7 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.28)]"
            >
              <p className="font-oswald text-[11px] uppercase tracking-[0.28em] text-safari-gold/90">
                {panelEyebrow || "Why this variant works"}
              </p>
              <h2 className="mt-3 font-heading text-3xl leading-tight text-white">
                {panelTitle || "Give premium itineraries a stronger opening narrative."}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/75">
                {panelBody ||
                  "Use the side panel for sales framing, destination trust signals, or a lighter way to introduce custom planning."}
              </p>
              <div className="mt-6 space-y-3">
                {(panelHighlights?.length ? panelHighlights : [
                  "Higher-contrast CTA cluster",
                  "Space for trust or itinerary hooks",
                  "Clearer premium landing-page hierarchy",
                ]).map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white/85"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="h-screen relative overflow-hidden">
      <Hero
        eyebrow={eyebrow}
        headlineScript={headlineScript}
        description={description}
        primaryCtaLabel={primaryCtaLabel}
        primaryCtaHref={primaryCtaHref}
        secondaryCtaLabel={secondaryCtaLabel}
        secondaryCtaHref={secondaryCtaHref}
        videoUrl={videoUrl}
      />
    </div>
  );
};

export default CinematicHeroSection;
