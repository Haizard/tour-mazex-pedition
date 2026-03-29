import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import KiliImg from "../../assets/Kilimanjaro.jpg";
import SafariImg from "../../assets/momentlion.jpg"; 
import AboutImg from "../../assets/camp1.jpg";
import FamilyImg from "../../assets/tembo.jpg";

const Welcome = () => {
  return (
    <div className="bg-white py-24">
      {/* Welcome Top Header Area */}
      <div className="container px-4 max-w-5xl mx-auto text-center mb-20">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl lg:text-6xl font-heading mb-6 text-gray-900 tracking-tight"
        >
          <i className="italic font-light text-gray-600">Welcome to </i> <br className="md:hidden" />
          <span className="font-oswald font-extrabold uppercase ml-2 text-safari-green">Tanzania Inside and Safari</span>
        </motion.h1>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl md:text-3xl font-heading text-gray-800 mb-8 max-w-4xl mx-auto leading-relaxed"
        >
          Travel's capacity to change you is just as significant as its capacity to benefit others, including the environment, communities, and wildlife.
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-base md:text-lg text-gray-600 font-sans leading-loose max-w-4xl mx-auto text-justify sm:text-center mb-16"
        >
          TANZANIA INSIDE AND SAFARI is an exclusive, unique African safari company that creates an experience based on the conversations we have with you. We literally customize each safari itinerary, listening to your dreams to carefully select the places you will go. On your private journey with up to six people, we create an intimate, life-changing experience in a safe environment for you to learn, experience, and be captivated with the wildlife of Africa. Traveling with us is powerful because we are a small, family-owned safari company that has close relationships with all of our guides. We are family. All of us are educated deeply in Wildlife Tourism or by the College of African Wildlife Management. And because of our knowledge of the Serengeti, Ngorongoro Crater, and Kilimanjaro, we will show you magic and you will return home a different person. Traveling with Tanzania Inside and Safari, you will help support and sustain the fragile communities and extraordinary wild spaces that are our home. This is important - we are not a corporation – we are locals.
        </motion.p>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-3xl md:text-4xl font-heading text-gray-900 max-w-4xl mx-auto leading-tight"
        >
          Experience the unmatched luxury of Africa’s wilderness with TANZANIA INSIDE AND SAFARI.
        </motion.h2>
      </div>

      {/* 2x2 Grid "Explore" Section (Alternating Cards) */}
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Card 1: Text Top, Image Bottom (Kilimanjaro) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col group cursor-pointer"
          >
            <Link to="/packages" className="flex flex-col h-full bg-surface hover:bg-white transition-colors duration-500 p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl">
              <div className="mb-8">
                <h3 className="text-3xl lg:text-4xl font-heading font-semibold text-gray-900 mb-4 transition-colors group-hover:text-safari-green">
                  Explore Our Kilimanjaro Packages
                </h3>
                <p className="text-gray-600 font-sans leading-relaxed">
                  Conquer Africa’s highest peak with our Kilimanjaro trekking packages. Whether you're a seasoned climber or a beginner, our expert guides ensure a safe, unforgettable journey to the summit. Choose your route and start your adventure today!
                </p>
              </div>
              <div className="flex-1 relative rounded-[24px] overflow-hidden min-h-[300px]">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10" />
                <img 
                  src={KiliImg} 
                  alt="Kilimanjaro Trekking" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Link>
          </motion.div>

          {/* Card 2: Image Top, Text Bottom (Safari) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col group cursor-pointer"
          >
            <Link to="/packages" className="flex flex-col h-full bg-surface hover:bg-white transition-colors duration-500 p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl">
              <div className="flex-1 relative rounded-[24px] overflow-hidden min-h-[300px] mb-8">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10" />
                <img 
                  src={SafariImg} 
                  alt="Safari Adventures" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div>
                <h3 className="text-3xl lg:text-4xl font-heading font-semibold text-gray-900 mb-4 transition-colors group-hover:text-safari-green">
                  Explore Our Safari Packages
                </h3>
                <p className="text-gray-600 font-sans leading-relaxed">
                  Join us on an unforgettable safari adventure! Discover Africa’s wildlife and stunning landscapes, from the Serengeti to the Ngorongoro Crater. Our tailored safari packages promise an experience you'll never forget. Book now and start your journey!
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Card 3: Image Top, Text Bottom (About Us) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col group cursor-pointer"
          >
            <Link to="/about" className="flex flex-col h-full bg-surface hover:bg-white transition-colors duration-500 p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl">
              <div className="flex-1 relative rounded-[24px] overflow-hidden min-h-[300px] mb-8">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10" />
                <img 
                  src={AboutImg} 
                  alt="About Us" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div>
                <h2 className="font-signature text-5xl text-safari-green mb-2 transition-colors">
                  About us
                </h2>
                <h3 className="text-xl font-heading font-semibold text-gray-900 mb-4">
                  Experience, Expertise, and Research – Unparalleled Trio
                </h3>
                <p className="text-gray-600 font-sans leading-relaxed">
                  Born from a passion for travel and decades of collective experience in the tourism sector, Tanzania Inside and Safari stands as a seasoned establishment. Crafted through meticulous research and attuned to customer preferences, our foundation stems from a commitment to authenticity. Our goal: crafting indelible memories for every traveler, be it a single-day excursion or an immersive multi-day expedition.
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Card 4: Text Top, Image Bottom (Family Safaris) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col group cursor-pointer"
          >
            <Link to="/packages" className="flex flex-col h-full bg-surface hover:bg-white transition-colors duration-500 p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl">
              <div className="mb-8">
                <h2 className="font-signature text-5xl text-safari-green mb-2 transition-colors">
                  Family Safaris
                </h2>
                <h3 className="text-xl font-heading font-semibold text-gray-900 mb-4">
                  “Best African safari with kids!”
                </h3>
              </div>
              <div className="flex-1 relative rounded-[24px] overflow-hidden min-h-[300px]">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10" />
                <img 
                  src={FamilyImg} 
                  alt="Family Safaris" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Welcome;
