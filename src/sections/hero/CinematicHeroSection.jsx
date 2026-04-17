import React from "react";
import Hero from "../../components/Hero/Hero";
import NatureVid from "../../assets/video/main.mp4";

const CinematicHeroSection = ({
  eyebrow,
  headlineScript,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}) => (
  <div className="h-screen relative overflow-hidden">
    <video
      autoPlay
      loop
      muted
      className="absolute right-0 top-0 h-full w-full object-fill z-0"
    >
      <source src={NatureVid} type="video/mp4" />
    </video>
    <Hero
      eyebrow={eyebrow}
      headlineScript={headlineScript}
      primaryCtaLabel={primaryCtaLabel}
      primaryCtaHref={primaryCtaHref}
      secondaryCtaLabel={secondaryCtaLabel}
      secondaryCtaHref={secondaryCtaHref}
    />
  </div>
);

export default CinematicHeroSection;
