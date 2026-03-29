import React from "react";
import Places from "../components/Places/Places";
import Badge from "../components/UI/Badge";

const PlacesRoute = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Cinematic Header */}
      <div className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523805009345-7448845a9e53?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="container relative z-20 text-center text-white">
          <Badge variant="primary" className="mb-4">
            Visual Journey
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter font-heading">
            Our <span className="text-primary italic">Gallery</span>
          </h1>
        </div>
      </div>
      <Places />
    </div>
  );
};

export default PlacesRoute;
