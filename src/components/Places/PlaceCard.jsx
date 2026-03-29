import React from "react";
import { IoLocationSharp } from "react-icons/io5";
import Card from "../UI/Card";
import Badge from "../UI/Badge";

const PlaceCard = ({ img, location, title }) => {
  return (
    <Card className="h-[250px] md:h-[400px] group relative overflow-hidden border-none cursor-pointer">
      <img
        src={img}
        alt={location}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute top-4 left-4">
        <Badge
          variant="primary"
          className="bg-white/20 backdrop-blur-md text-white border-white/30"
        >
          Featured
        </Badge>
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="flex items-center gap-2 text-primary mb-2">
          <IoLocationSharp className="text-lg" />
          <span className="text-xs font-black uppercase tracking-widest">
            {location}
          </span>
        </div>
        <h3 className="text-2xl font-black text-white leading-tight group-hover:text-primary transition-colors">
          {title || "Explore Destination"}
        </h3>
      </div>
    </Card>
  );
};

export default PlaceCard;
