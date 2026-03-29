import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const destinations = [
  { name: "Kenya", link: "/packages?location=Kenya" },
  { name: "Uganda", link: "/packages?location=Uganda" },
  { name: "Tanzania", link: "/packages?location=Tanzania" },
  { name: "Rwanda", link: "/packages?location=Rwanda" },
];

const AfricanDestinations = () => {
  return (
    <div className="bg-[#fafafa] py-24 pb-32">
      <div className="container px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Side: Header and Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col"
          >
            <h2 className="text-[40px] md:text-[56px] font-heading text-gray-900 leading-[1.1] mb-10 tracking-tight">
              Our African Safari <br className="hidden md:block" />
              <em className="font-signature text-safari-green text-[70px] md:text-[90px] lowercase px-1 relative inline-block -mt-4 md:-mt-6">Destinations</em>
            </h2>
            
            <div className="bg-white border-l-4 border-safari-green p-6 md:p-8 mb-10 shadow-sm rounded-r-xl">
              <p className="italic text-gray-700 font-sans text-lg md:text-xl leading-relaxed">
                “Africa's wildlife is so unique that there is nothing else like it anywhere on Earth. It's the world's greatest theatre, the greatest show on Earth.” 
                <span className="block mt-4 text-sm font-bold text-gray-900 tracking-wider uppercase">— Sir David Attenborough</span>
              </p>
            </div>
            
            <p className="text-gray-600 font-sans text-lg leading-[1.8] mb-6">
              Experience the epitome of Africa's opulent travel, meticulously crafted to match your preferences. Whether your heart yearns for the enchanting allure of a deluxe safari in Tanzania, the captivating gorilla tracking escapade in Rwanda, or an immersive journey through Zanzibar's cultural tapestry and serene beaches, we specialize in curating unparalleled experiences in the realm of your aspirations.
            </p>
            
            <p className="text-gray-600 font-sans text-lg leading-[1.8]">
              Each nation presents unparalleled and awe-inspiring interactions with wildlife, nature, and indigenous traditions. Delve into the intricacies of our destinations, unveiling the facets that resonate with your desires, and unearth your ultimate African luxury travel escapade.
            </p>
          </motion.div>

          {/* Right Side: Destination Links Matrix */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-8 md:pl-10 pt-10 lg:pt-0"
          >
            {destinations.map((dest, index) => (
              <motion.div
                key={dest.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
              >
                <Link 
                  to={dest.link} 
                  onClick={() => window.scrollTo(0, 0)}
                  className="relative block py-6 border-b border-gray-200 group overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <h2 className="text-4xl md:text-[44px] font-heading text-gray-900 group-hover:text-safari-green transition-colors duration-500">
                      {dest.name}
                    </h2>
                    {/* Optional Arrow for UX, not in original HTML but nice for React */}
                    <span className="text-safari-green opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500 text-2xl">
                      →
                    </span>
                  </div>
                  
                  {/* The Massive Background Signature Font from HTML */}
                  <span className="absolute top-1/2 -translate-y-1/2 left-8 md:left-12 -z-10 text-[80px] md:text-[110px] font-signature text-gray-100 group-hover:text-safari-green/5 transition-colors duration-500 pointer-events-none select-none">
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
