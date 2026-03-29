import React from "react";
import PackagesComp from "../components/Blogs/PackagesComp";
import Badge from "../components/UI/Badge";

const PackagesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cinematic Header */}
      <div className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504735012399-55f659e1e78b?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="container relative z-20 text-center text-white">
          <Badge variant="secondary" className="mb-4">
            Curated Expeditions
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter font-heading">
            Our <span className="text-primary italic">Packages</span>
          </h1>
        </div>
      </div>
      <PackagesComp />
    </div>
  );
};

export default PackagesPage;
