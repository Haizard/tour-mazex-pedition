import React from "react";
import { motion } from "framer-motion";
import { Shield, Map, Compass, Users } from "lucide-react";
import Card from "../UI/Card";

const features = [
  {
    icon: <Shield className="w-8 h-8 text-primary" />,
    title: "Safe & Secure",
    desc: "Your safety is our priority with certified guides and premium equipment.",
  },
  {
    icon: <Map className="w-8 h-8 text-secondary" />,
    title: "Expert Guides",
    desc: "Local experts who know every hidden gem and secret trail.",
  },
  {
    icon: <Compass className="w-8 h-8 text-accent" />,
    title: "Customized Trips",
    desc: "Tailor-made itineraries designed specifically for your interests.",
  },
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: "Small Groups",
    desc: "Intimate travel experiences with a focus on personal connection.",
  },
];

const Features = () => {
  return (
    <div className="py-24 bg-slate-100">
      <div className="container">
        <div className="text-center mb-16">
          <p className="text-primary font-bold uppercase tracking-widest mb-3 text-sm">
            Why Choose Us
          </p>
          <h2 className="text-4xl md:text-5xl font-black font-heading text-slate-900">
            The Makolo Difference
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <Card
              key={i}
              delay={i * 0.1}
              className="p-8 text-center flex flex-col items-center bg-white shadow-lg border border-slate-100 hover:border-primary/30"
            >
              <div className="mb-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                {f.icon}
              </div>
              <h3 className="text-xl font-black mb-3 text-slate-900 tracking-tight">
                {f.title}
              </h3>
              <p className="text-slate-600 font-medium leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
