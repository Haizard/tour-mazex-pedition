import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchTaxonomies } from "../../services/api";

const defaultDestinations = [
  { name: "Kenya", slug: "kenya" },
  { name: "Uganda", slug: "uganda" },
  { name: "Tanzania", slug: "tanzania" },
  { name: "Rwanda", slug: "rwanda" },
];

const defaultContent = {
  title: "Our African Safari Destinations",
  subtitle: "Safari / African Safari",
  description:
    "Experience the epitome of Africa's travel, crafted for you. Deluxe safari in Tanzania or beaches in Zanzibar.",
  quote: "Africa's wildlife is... the greatest show on Earth.",
  quoteAuthor: "Attenborough",
};

const AfricanDestinations = ({
  variant = "quote-list",
  title = defaultContent.title,
  subtitle = defaultContent.subtitle,
  description = defaultContent.description,
  quote = defaultContent.quote,
  quoteAuthor = defaultContent.quoteAuthor,
}) => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const response = await fetchTaxonomies("destination");
        const nextDestinations =
          response.data && response.data.length > 0
            ? response.data
            : defaultDestinations;

        setDestinations(nextDestinations);
      } catch (error) {
        console.error("Error loading destinations data:", error);
        setDestinations(defaultDestinations);
      } finally {
        setLoading(false);
      }
    };

    loadDestinations();
  }, []);

  const titleParts = title.split(" ");
  const firstTitlePart = titleParts[0] || "Our";

  if (variant === "destination-grid") {
    return (
      <div className="bg-[#faf7f1] py-14 md:py-24">
        <div className="container px-4 max-w-7xl mx-auto">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-oswald text-xs uppercase tracking-[0.3em] text-safari-green">
              {subtitle}
            </p>
            <h2 className="mt-4 font-heading text-4xl leading-tight text-slate-900 md:text-6xl">
              {title}
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
              {description}
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {(loading ? defaultDestinations : destinations).map((dest, index) => (
              <motion.div
                key={dest.slug || dest.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <Link
                  to={`/packages?search=${dest.name}`}
                  onClick={() => window.scrollTo(0, 0)}
                  className="group block rounded-[28px] border border-[#e7dcc8] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-safari-green/40 hover:shadow-xl"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-safari-green">
                    Destination
                  </p>
                  <h3 className="mt-4 font-heading text-3xl text-slate-900">
                    {dest.name}
                  </h3>
                  <p className="mt-8 font-oswald text-sm uppercase tracking-[0.18em] text-slate-500 group-hover:text-safari-green">
                    Explore destination
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl rounded-[28px] border border-[#e7dcc8] bg-white px-6 py-8 text-center shadow-sm">
            <p className="italic text-slate-700 md:text-lg">
              "{quote}"
            </p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              {quoteAuthor}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] py-12 md:py-24 pb-16 md:pb-32 overflow-hidden">
      <div className="container px-2 sm:px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 gap-4 sm:gap-8 md:gap-24 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col"
          >
            <h2 className="text-[20px] sm:text-[32px] md:text-[56px] font-heading text-gray-900 leading-tight mb-4 md:mb-10 tracking-tight">
              {firstTitlePart} <span className="md:hidden">Safari</span>{" "}
              <br className="hidden md:block" />
              <span className="hidden md:inline">{subtitle} </span>
              {!subtitle.toLowerCase().includes("destinations") && (
                <em className="font-signature text-safari-green text-[28px] sm:text-[50px] md:text-[90px] lowercase block md:inline-block -mt-1 md:-mt-6">
                  Destinations
                </em>
              )}
            </h2>

            <div className="bg-white border-l-2 md:border-l-4 border-safari-green p-3 md:p-8 mb-4 md:mb-10 shadow-sm rounded-r-lg md:rounded-r-xl">
              <p className="italic text-gray-700 font-sans text-[10px] sm:text-base md:text-xl leading-snug md:leading-relaxed">
                "{quote}"
                <span className="block mt-2 text-[8px] md:text-sm font-bold text-gray-900 uppercase tracking-tighter md:tracking-widest">
                  - {quoteAuthor}
                </span>
              </p>
            </div>

            <div className="space-y-3 md:space-y-6">
              <p className="text-gray-600 font-sans text-[11px] sm:text-[15px] md:text-lg leading-relaxed">
                {description}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-2 md:gap-8 pt-2 md:pt-0"
          >
            {(loading ? defaultDestinations : destinations).map((dest, index) => (
              <motion.div
                key={dest.slug || dest.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <Link
                  to={`/packages?search=${dest.name}`}
                  onClick={() => window.scrollTo(0, 0)}
                  className="relative block py-2 md:py-6 border-b border-gray-100 md:border-gray-200 group"
                >
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <h2 className="text-[14px] sm:text-[24px] md:text-[44px] font-heading text-gray-900 group-hover:text-safari-green transition-colors duration-500 font-bold md:font-normal uppercase md:capitalize tracking-tight md:tracking-normal">
                      {dest.name}
                    </h2>
                    <span className="text-safari-green text-xs md:text-2xl">
                      {"->"}
                    </span>
                  </div>

                  <span className="hidden md:block absolute top-1/2 -translate-y-1/2 left-4 md:left-12 -z-10 text-[60px] md:text-[110px] font-signature text-gray-100/60 group-hover:text-safari-green/10 pointer-events-none select-none">
                    {dest.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AfricanDestinations;
