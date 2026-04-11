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

const StaticSlider = ({ children }) => <div>{React.Children.toArray(children)[0] || null}</div>;

const Testimonial = () => {
  const SliderComponent =
    typeof window === "undefined" || typeof Slider !== "function" ? StaticSlider : Slider;
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
      className="relative w-full py-6 md:py-20 lg:py-24 bg-cover bg-center bg-fixed flex items-center justify-center lg:justify-end lg:pr-[10%]" 
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl shadow-2xl mx-4 md:mx-6 overflow-hidden border border-white/20"
      >
        {/* Header Block */}
        <div className="relative pt-3 pb-3 text-center border-b border-gray-100 px-4">
          <div className="absolute top-1.5 right-3 flex items-center gap-1 bg-[#efffe2] px-1.5 py-0.5 rounded-full border border-[#d4f5b8]">
             <img src="https://www.tripadvisor.com/favicon.ico" alt="Tripadvisor" className="w-2.5 h-2.5" />
             <span className="text-[8px] font-bold text-[#00af87] uppercase tracking-wider">Tripadvisor</span>
          </div>

          <h4 className="text-[16px] md:text-[28px] font-black text-gray-900 tracking-tighter mb-0.5 md:mb-2 font-heading">EXCELLENT</h4>
          
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center space-x-1">
               {[1, 2, 3, 4, 5].map((_, i) => (
                 <div key={i} className="bg-[#00af87] p-1 rounded-full shadow-sm">
                   <FaStar className="text-white text-[8px]" />
                 </div>
               ))}
            </div>
            <p className="text-[10px] text-gray-500 font-medium font-sans">
              Based on <span className="text-gray-900 font-bold underline decoration-safari-green decoration-1">30 reviews</span>
            </p>
          </div>
        </div>

        {/* User Reviews Slider Area - EXTREME HEIGHT REDUCTION */}
        <div className="pb-3 pt-1">
          <SliderComponent {...settings}>
            {testimonialData.map((review) => (
              <div key={review.id} className="outline-none px-4 md:px-6 py-2">
                <div className="flex flex-row items-center text-left gap-3">
                  
                  {/* User Avatar */}
                  <div className="relative flex-shrink-0">
                    <img 
                      src={review.img} 
                      alt={review.name}
                      className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] rounded-lg md:rounded-xl object-cover shadow-sm border-2 border-white ring-1 ring-gray-50" 
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white p-0.5 rounded-full">
                      <FaCheckCircle className="text-[6px]" />
                    </div>
                  </div>
                  
                  {/* Review text area truncated to 2 lines */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="text-xs md:text-base text-gray-900 font-bold font-heading truncate">{review.name}</h4>
                      <div className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase">{review.date}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[#00af87] text-[10px] md:text-xs mb-1">
                      <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                      <span className="ml-1 text-[8px] md:text-[9px] bg-green-50 text-green-700 px-1 py-0.5 rounded font-bold uppercase">Verified</span>
                    </div>
                    <p className="text-[11px] md:text-[15px] font-sans text-gray-500 md:text-gray-700 leading-tight md:leading-relaxed italic line-clamp-2 md:line-clamp-none">
                      "{review.text}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </SliderComponent>
        </div>
      </motion.div>
    </div>
  );
};

export default Testimonial;
