import React from "react";

const logos = [
  "/assets/images/tanapa.png",
  "/assets/images/tanapalogo.png",
  "/assets/images/ttblogo.png",
  "/assets/images/tatologo.png",
];

// Duplicate the array to create a seamless infinite loop
const sliderLogos = [...logos, ...logos, ...logos, ...logos];

const LogoSlider = () => {
  return (
    <div className="relative w-full h-[100px] bg-white mx-auto overflow-hidden shadow-[0_10px_20px_-5px_rgba(0,0,0,0.125)] py-4">
      {/* Left Gradient Overlay */}
      <div className="absolute top-0 left-0 h-full w-[100px] md:w-[200px] bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />

      {/* Right Gradient Overlay */}
      <div className="absolute top-0 right-0 h-full w-[100px] md:w-[200px] bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      {/* Animated Track */}
      <div className="flex w-[max-content] animate-scroll-infinite hover:[animation-play-state:paused] items-center h-full">
        {sliderLogos.map((logo, index) => (
          <div
            key={index}
            className="flex justify-center items-center w-[250px] h-[100px] bg-white rounded-[5px] mx-2 shrink-0"
          >
            <img
              src={logo}
              alt="Partner Logo"
              className="max-h-[75px] max-w-[110px] object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
              onError={(e) => {
                // Fallback for missing local images just in case
                e.target.src = "https://placehold.co/110x75/white/black?text=Partner";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoSlider;
