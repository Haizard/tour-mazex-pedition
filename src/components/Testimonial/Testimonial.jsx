import React from "react";
import Slider from "react-slick";
import { FaCheckCircle, FaStar } from "react-icons/fa";

const testimonialData = [
  {
    id: 1,
    name: "Roderick P",
    date: "2025-01-21",
    text: "My family and I had an amazing combination of a safari and a Kilimanjaro trek with Mazex Pedition. Our safari guide, Laurent, was fantastic...",
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
      className="relative w-full h-auto py-12 md:py-16 md:h-[520px] bg-cover bg-center bg-fixed flex items-center justify-center md:justify-end md:pr-[10%]" 
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
    >
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Carousel Wrapper - White Box floating on the right */}
      <div className="relative z-10 w-full max-w-[450px] bg-white md:rounded-xl shadow-2xl mx-4 md:mx-0 overflow-hidden">
        
        {/* Tripadvisor top block */}
        <div className="pt-8 pb-6 text-center border-b border-gray-100 flex flex-col items-center justify-center">
          <h4 className="text-[24px] font-black text-gray-900 tracking-widest mb-2 font-sans">EXCELLENT</h4>
          <div className="flex gap-1 text-[#34e0a1] text-2xl mb-2 items-center justify-center">
            {/* TripAdvisor colored circles */}
            <div className="flex items-center space-x-1">
               <div className="bg-[#34e0a1] p-1.5 rounded-full"><FaStar className="text-white text-xs" /></div>
               <div className="bg-[#34e0a1] p-1.5 rounded-full"><FaStar className="text-white text-xs" /></div>
               <div className="bg-[#34e0a1] p-1.5 rounded-full"><FaStar className="text-white text-xs" /></div>
               <div className="bg-[#34e0a1] p-1.5 rounded-full"><FaStar className="text-white text-xs" /></div>
               <div className="bg-[#34e0a1] p-1.5 rounded-full"><FaStar className="text-white text-xs" /></div>
            </div>
          </div>
          <h6 className="text-[18px] text-gray-700 font-sans">Based on <b className="font-bold">30 reviews</b></h6>
        </div>

        {/* React Slick Slider container mimicking Owl Carousel */}
        <div className="pb-4">
          <Slider {...settings}>
            {testimonialData.map((review) => (
              <div key={review.id} className="outline-none">
                <div className="flex items-start bg-white p-6 relative">
                  
                  {/* Avatar */}
                  <img 
                    src={review.img} 
                    alt={review.name}
                    className="w-[50px] h-[50px] rounded-full mr-5 object-cover shrink-0" 
                  />
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-base text-gray-900 font-bold font-sans">{review.name}</h4>
                    </div>
                    <div className="text-xs text-gray-500 mb-2 font-medium">{review.date}</div>
                    
                    {/* Rating & Verification */}
                    <div className="flex items-center gap-1 text-[#34e0a1] text-[10px] mb-3">
                      <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                      <span className="text-[12px] text-green-800 ml-2 font-bold flex items-center gap-1">
                        <FaCheckCircle className="text-green-700" /> Verified
                      </span>
                    </div>
                    
                    {/* Review Text */}
                    <div className="text-[16px] font-sans text-gray-900 leading-relaxed">
                      {review.text} 
                      <a href="#" className="text-green-700 font-bold hover:underline ml-1">
                        Read more
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
