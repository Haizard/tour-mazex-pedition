import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchTaxonomies, fetchHomeContent } from "../../services/api";

const defaultDestinations = [
  { name: "Kenya", slug: "kenya" },
  { name: "Uganda", slug: "uganda" },
  { name: "Tanzania", slug: "tanzania" },
  { name: "Rwanda", slug: "rwanda" },
];

const AfricanDestinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [content, setContent] = useState({
    title: "Our African Safari Destinations",
    subtitle: "Safari / African Safari",
    description: "Experience the epitome of Africa's travel, crafted for you. Deluxe safari in Tanzania or beaches in Zanzibar.",
    quote: "Africa's wildlife is... the greatest show on Earth.",
    quoteAuthor: "Attenborough"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [taxRes, contentRes] = await Promise.all([
          fetchTaxonomies("destination"),
          fetchHomeContent()
        ]);

        if (taxRes.data && taxRes.data.length > 0) {
          setDestinations(taxRes.data);
        } else {
          setDestinations(defaultDestinations);
        }

        const destContent = contentRes.data.find(s => s.section === "destinations");
        if (destContent) {
          setContent({
            title: destContent.title || content.title,
            subtitle: destContent.subtitle || content.subtitle,
            description: destContent.description || content.description,
            quote: destContent.quote || content.quote,
            quoteAuthor: destContent.quoteAuthor || content.quoteAuthor
          });
        }
      } catch (error) {
        console.error("Error loading destinations data:", error);
        setDestinations(defaultDestinations);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Split title if it contains spaces to handle the hidden/inline logic
  const titleParts = content.title.split(" ");
  const mainTitlePart = titleParts.slice(1).join(" ");
  const firstTitlePart = titleParts[0];

  return (
    <div className="bg-[#fafafa] py-12 md:py-24 pb-16 md:pb-32 overflow-hidden">
      <div className="container px-2 sm:px-4 max-w-7xl mx-auto">
        {/* Main Grid: Forces 2 columns even on mobile */}
        <div className="grid grid-cols-2 gap-4 sm:gap-8 md:gap-24 items-start">
          
          {/* Left Column: Header and Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col"
          >
            <h2 className="text-[20px] sm:text-[32px] md:text-[56px] font-heading text-gray-900 leading-tight mb-4 md:mb-10 tracking-tight">
              {firstTitlePart} <span className="md:hidden">Safari</span> <br className="hidden md:block" />
              <span className="hidden md:inline">{content.subtitle}</span>
              <em className="font-signature text-safari-green text-[28px] sm:text-[50px] md:text-[90px] lowercase block md:inline-block -mt-1 md:-mt-6">Destinations</em>
            </h2>
            
            <div className="bg-white border-l-2 md:border-l-4 border-safari-green p-3 md:p-8 mb-4 md:mb-10 shadow-sm rounded-r-lg md:rounded-r-xl">
              <p className="italic text-gray-700 font-sans text-[10px] sm:text-base md:text-xl leading-snug md:leading-relaxed">
                “{content.quote}” 
                <span className="block mt-2 text-[8px] md:text-sm font-bold text-gray-900 uppercase tracking-tighter md:tracking-widest">— {content.quoteAuthor}</span>
              </p>
            </div>
            
            <div className="space-y-3 md:space-y-6">
              <p className="text-gray-600 font-sans text-[11px] sm:text-[15px] md:text-lg leading-relaxed">
                {content.description}
              </p>
            </div>
          </motion.div>

          {/* Right Column: Side-by-Side Country List */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-2 md:gap-8 pt-2 md:pt-0"
          >
            {destinations.map((dest, index) => (
              <motion.div
                key={dest.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + (index * 0.1) }}
              >
                <Link 
                  to={`/packages?location=${dest.name}`} 
                  onClick={() => window.scrollTo(0, 0)}
                  className="relative block py-2 md:py-6 border-b border-gray-100 md:border-gray-200 group"
                >
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <h2 className="text-[14px] sm:text-[24px] md:text-[44px] font-heading text-gray-900 group-hover:text-safari-green transition-colors duration-500 font-bold md:font-normal uppercase md:capitalize tracking-tight md:tracking-normal">
                      {dest.name}
                    </h2>
                    <span className="text-safari-green text-xs md:text-2xl">
                      →
                    </span>
                  </div>
                  
                  {/* Subtle Background Signature - Only for Tablet/Desktop as it crowds mobile */}
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
