import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TripCTA = () => {
  return (
    <section
      className="relative w-full bg-cover bg-center bg-no-repeat py-8 md:py-20 lg:py-24"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1547970810-dc1eac37d174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
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
              Let's talk about your
            </h2>
            <h4 className="text-safari-green font-heading text-xl md:text-4xl font-light mt-0.5 md:mt-2">
              Trip to Africa!
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
              All our custom itineraries are inspired by our travel experts and positive feedback from past travelers. We're sharing them so you can get a taste of the experience. However, we're flexible and can tailor-make an itinerary just for you. Let us know your preferences, and our safari experts will create a personalized proposal.
            </p>

            <div className="flex flex-wrap gap-2 md:gap-4">
              <Link
                to="/blogs"
                onClick={() => window.scrollTo(0, 0)}
                className="font-oswald uppercase tracking-wider text-[10px] md:text-sm bg-safari-green text-white px-4 md:px-8 py-2 md:py-3.5 rounded-md hover:bg-green-800 transition-colors duration-300"
              >
                Useful Articles
              </Link>
              <Link
                to="/contact"
                onClick={() => window.scrollTo(0, 0)}
                className="font-oswald uppercase tracking-wider text-[10px] md:text-sm bg-safari-green text-white px-4 md:px-8 py-2 md:py-3.5 rounded-md hover:bg-green-800 transition-colors duration-300"
              >
                Plan My Trip
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default TripCTA;
