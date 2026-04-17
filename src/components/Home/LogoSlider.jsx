import React from "react";

const defaultLogos = [
  "/assets/images/tanapa.png",
  "/assets/images/tanapalogo.png",
  "/assets/images/ttblogo.png",
  "/assets/images/tatologo.png",
];

const LogoSlider = ({
  logos = defaultLogos,
  backgroundColor = "#ffffff",
  title = "",
}) => {
  const safeLogos = logos?.length ? logos : defaultLogos;
  const sliderLogos = [...safeLogos, ...safeLogos, ...safeLogos, ...safeLogos];

  return (
    <div
      className="relative w-full h-[70px] mx-auto overflow-hidden shadow-[0_10px_20px_-5px_rgba(0,0,0,0.125)] py-2"
      style={{ backgroundColor }}
    >
      {title ? (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden lg:block">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
            {title}
          </p>
        </div>
      ) : null}

      <div className="absolute top-0 left-0 h-full w-[100px] md:w-[200px] bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 h-full w-[100px] md:w-[200px] bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div className="flex w-[max-content] animate-scroll-infinite hover:[animation-play-state:paused] items-center h-full">
        {sliderLogos.map((logo, index) => (
          <div
            key={`${logo}-${index}`}
            className="flex justify-center items-center w-[200px] h-[50px] rounded-[5px] mx-2 shrink-0"
            style={{ backgroundColor }}
          >
            <img
              src={logo}
              alt="Partner Logo"
              className="max-h-[450px] md:max-h-[50px] max-w-[90px] object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/110x75/white/black?text=Partner";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoSlider;
