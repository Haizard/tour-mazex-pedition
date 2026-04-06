import React from "react";
import AfricanDestinations from "../components/Home/AfricanDestinations";
import Hero from "../components/Hero/Hero";
import NatureVid from "../assets/video/main.mp4";
import BlogsComp from "../components/Blogs/BlogsComp";
import Places from "../components/Places/Places";
import Testimonial from "../components/Testimonial/Testimonial";
import LogoSlider from "../components/Home/LogoSlider";
import TripCTA from "../components/Home/TripCTA";

import PopularTours from "../components/Home/PopularTours";
import GroupTours from "../components/Home/GroupTours";
import Welcome from "../components/Home/Welcome";
import Trending from "../components/Home/Trending";
import SEO from "../components/UI/SEO";

const Home = () => {
  const [orderPopup, setOrderPopup] = React.useState(false);

  return (
    <div>
      <SEO 
        title="Tanzania Luxury Safaris & Adventure Tours"
        description="MAZ Expeditions offers premium safari experiences in Serengeti, Ngorongoro, and Zanzibar. Book your dream African holiday today."
        keywords={["Safari", "Tanzania", "Serengeti", "Zanzibar", "Luxury Travel", "MAZ Expeditions"]}
      />
      {/* Hero — dark */}
      <div className="h-screen relative overflow-hidden">
        <video
          autoPlay
          loop
          muted
          className="absolute right-0 top-0 h-full w-full object-contain bg-gray-50 z-0"
        >
          <source src={NatureVid} type="video/mp4" />
        </video>
        <Hero />
      </div>


      {/* Trending — dark (bg-background) */}
      <Trending />

      {/* Welcome & Featured Categories - from HTML Design */}
      <Welcome />

      {/* Popular Tours - from HTML Design */}
      <PopularTours />

      {/* Group Tours - from HTML Design */}
      <GroupTours />

      {/* Blogs — warm ivory (bg-surface) */}
      <BlogsComp maxPerCategory={3} />

      {/* Our African Safari Destinations - from HTML Design */}
      <AfricanDestinations />

      {/* Testimonials — warm ivory (bg-surface) */}
      <Testimonial />

      {/* Trip to Africa CTA - from HTML Design with gap spacing */}
      <div className="mt-12 md:mt-16">
        <TripCTA />
      </div>

      {/* Partner Logo Slider - continuous horizontal animation */}
      <LogoSlider />
    </div>
  );
};

export default Home;
