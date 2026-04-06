import React from "react";
import Slider from "react-slick";
import { FaCheckCircle, FaStar } from "react-icons/fa";
import { motion } from "framer-motion";

const testimonialData = [
  {
    id: 1,
    name: "Roderick P",
    date: "2025-01-21",
    text: "My family and I had an amazing combination of a safari and a Kilimanjaro trek with MAZ Expeditions. Our safari guide, Laurent, was fantastic...",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 2,
    name: "Jane R",
    date: "2025-01-10",
    text: "The safari was absolutely stunning! Every detail was managed perfectly, and the wildlife was breathtaking. I will never forget the Serengeti.",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 3,
    name: "William J",
    date: "2025-01-12",
    text: "Our Kilimanjaro trek via the Lemosho Route was beyond incredible! From the moment we arrived, the team made us feel safe and well-prepared...",
    img: "https://randomuser.me/api/portraits/men/50.jpg",
  },
];

const Testimonial = () => {
  const settings = {
    dots: false,
    arrows: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
  };

  return (
    <div 
      className="relative w-full py-10 md:py-20 bg-cover bg-center bg-fixed flex items-center justify-center lg:justify-end lg:pr-[10%]" 
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
    >
      {/* Dynamic Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>

      {/* Testimonial Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl shadow-2xl mx-4 md:mx-6 overflow-hidden border border-white/20"
      >
        {/* Header Block: Detailed TripAdvisor Style */}
        <div className="relative pt-6 pb-6 text-center border-b border-gray-100 px-6">
          <div className="absolute top-2 right-4 flex items-center gap-1 bg-[#efffe2] px-2 py-0.5 rounded-full border border-[#d4f5b8]">
             <img src="https://www.tripadvisor.com/favicon.ico" alt="Tripadvisor" className="w-3 h-3" />
             <span className="text-[9px] font-bold text-[#00af87] uppercase tracking-wider">Tripadvisor</span>
          </div>

          <h4 className="text-[20px] md:text-[24px] font-black text-gray-900 tracking-tighter mb-1 font-heading">EXCELLENT</h4>
          
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center space-x-1">
               {[1, 2, 3, 4, 5].map((_, i) => (
                 <div key={i} className="bg-[#00af87] p-1.5 rounded-full shadow-sm">
                   <FaStar className="text-white text-[10px]" />
                 </div>
               ))}
            </div>
            <p className="text-xs text-gray-500 font-medium font-sans">
              Based on <span className="text-gray-900 font-bold underline decoration-safari-green decoration-2">30 verified reviews</span>
            </p>
          </div>
        </div>

        {/* User Reviews Slider */}
        <div className="pb-6 pt-2">
          <Slider {...settings}>
            {testimonialData.map((review) => (
              <div key={review.id} className="outline-none px-6 md:px-8">
                <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-3 md:gap-5 py-4">
                  
                  {/* User Avatar with Verification Badge */}
                  <div className="relative flex-shrink-0">
                    <img 
                      src={review.img} 
                      alt={review.name}
                      className="w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-xl md:rounded-2xl object-cover shadow-md border-2 border-white ring-2 ring-gray-50" 
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white p-0.5 rounded-full shadow-sm border-2 border-white">
                      <FaCheckCircle className="text-[8px]" />
                    </div>
                  </div>
                  
                  {/* Content Block */}
                  <div className="flex-1">
                    <div className="mb-2">
                      <h4 className="text-base md:text-lg text-gray-900 font-bold font-heading mb-0">{review.name}</h4>
                      <div className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">{review.date}</div>
                    </div>
                    
                    {/* Highlight for Star Rating */}
                    <div className="flex items-center justify-center md:justify-start gap-1 text-[#00af87] text-xs mb-2">
                      <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                      <span className="ml-2 text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Verified</span>
                    </div>
                    
                    {/* Review Text */}
                    <p className="text-[14px] md:text-[15px] font-sans text-gray-600 leading-snug italic line-clamp-3">
                      "{review.text}"
                    </p>
                    
                    <div className="mt-5">
                      <button className="text-sm font-bold text-safari-green hover:text-green-800 transition-colors inline-flex items-center gap-2 group/btn">
                        Read full story 
                        <span className="transform transition-transform group-hover/btn:translate-x-1">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </motion.div>
    </div>
  );
};

export default Testimonial;
