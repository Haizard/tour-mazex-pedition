import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TripCTA = ({
  variant = "trip-cta",
  heading = "Let's talk about your",
  subheading = "Trip to Africa!",
  description = "All our custom itineraries are inspired by our travel experts and positive feedback from past travelers. We're sharing them so you can get a taste of the experience. However, we're flexible and can tailor-make an itinerary just for you. Let us know your preferences, and our safari experts will create a personalized proposal.",
  primaryLabel = "Useful Articles",
  primaryHref = "/blogs",
  secondaryLabel = "Plan My Trip",
  secondaryHref = "/contact",
  accentLabel = "",
  backgroundImage = "https://images.unsplash.com/photo-1547970810-dc1eac37d174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
}) => {
  if (variant === "split-invite") {
    return (
      <section className="py-14 md:py-24">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="overflow-hidden rounded-[32px] border border-[#dcccb8] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)] md:grid md:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 md:p-12">
              {accentLabel ? (
                <p className="font-oswald text-xs uppercase tracking-[0.3em] text-safari-green">
                  {accentLabel}
                </p>
              ) : null}
              <h2 className="mt-4 font-heading text-3xl leading-tight text-slate-900 md:text-5xl">
                {heading}
              </h2>
              <h4 className="mt-3 font-heading text-2xl text-safari-green md:text-4xl">
                {subheading}
              </h4>
              <p className="mt-6 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                {description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={primaryHref}
                  onClick={() => window.scrollTo(0, 0)}
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-oswald text-sm uppercase tracking-[0.18em] text-white transition hover:bg-slate-800"
                >
                  {primaryLabel}
                </Link>
                <Link
                  to={secondaryHref}
                  onClick={() => window.scrollTo(0, 0)}
                  className="rounded-2xl bg-safari-green px-6 py-4 font-oswald text-sm uppercase tracking-[0.18em] text-white transition hover:bg-green-800"
                >
                  {secondaryLabel}
                </Link>
              </div>
            </div>

            <div
              className="min-h-[320px] bg-cover bg-center"
              style={{ backgroundImage: `url('${backgroundImage}')` }}
            >
              <div className="h-full w-full bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative w-full bg-cover bg-center bg-no-repeat py-8 md:py-20 lg:py-24"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
      }}
    >
      {/* Gradient overlay matching HTML's linear-gradient(to top, rgba(139,69,19,...)) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

      <div className="relative z-10 container max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-0">

          {/* LEFT: Heading block — matches .line-heading-left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="md:w-[38%] text-center md:text-right shrink-0 md:pr-8"
          >
            <h2 className="text-white font-heading text-2xl md:text-5xl font-bold leading-tight">
              {heading}
            </h2>
            <h4 className="text-safari-green font-heading text-xl md:text-4xl font-light mt-0.5 md:mt-2">
              {subheading}
            </h4>
          </motion.div>

          {/* Vertical divider — matches border-left: 3px solid green */}
          <div className="hidden md:block w-[3px] bg-safari-green self-stretch mx-2 min-h-[80px]" />

          {/* RIGHT: Body text + CTAs — matches .line-heading p */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="md:w-[62%] md:pl-8"
          >
            <p className="text-white/80 font-sans text-xs md:text-lg leading-relaxed md:leading-7 mb-4 md:mb-8 line-clamp-3 md:line-clamp-none">
              {description}
            </p>

            <div className="flex flex-wrap gap-2 md:gap-4">
              <Link
                to={primaryHref}
                onClick={() => window.scrollTo(0, 0)}
                className="font-oswald uppercase tracking-wider text-[10px] md:text-sm bg-safari-green text-white px-4 md:px-8 py-2 md:py-3.5 rounded-md hover:bg-green-800 transition-colors duration-300"
              >
                {primaryLabel}
              </Link>
              <Link
                to={secondaryHref}
                onClick={() => window.scrollTo(0, 0)}
                className="font-oswald uppercase tracking-wider text-[10px] md:text-sm bg-safari-green text-white px-4 md:px-8 py-2 md:py-3.5 rounded-md hover:bg-green-800 transition-colors duration-300"
              >
                {secondaryLabel}
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default TripCTA;
