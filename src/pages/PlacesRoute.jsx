import React from "react";
import Places from "../components/Places/Places";
import Badge from "../components/UI/Badge";
import SEO from "../components/UI/SEO";
import { buildBreadcrumbSchema } from "../utils/seo";

const PlacesRoute = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Tanzania Safari Destinations"
        description="Discover Tanzania safari destinations with MAZ Expeditions, including Serengeti, Ngorongoro, Tarangire, Lake Manyara, and Lake Natron."
        keywords={["Tanzania destinations", "Serengeti", "Ngorongoro", "Tarangire", "safari destinations"]}
        canonicalUrl="/destinations"
        schema={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Destinations", path: "/destinations" },
        ])}
        type="website"
      />
      {/* Cinematic Header */}
      <div className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523805009345-7448845a9e53?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="container relative z-20 text-center text-white">
          <Badge variant="primary" className="mb-4">
            Destination Guides
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter font-heading">
            Our <span className="text-primary italic">Destinations</span>
          </h1>
        </div>
      </div>
      <Places />
    </div>
  );
};

export default PlacesRoute;
