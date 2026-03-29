import React from "react";
import { Link } from "react-router-dom";

const NoPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background" />

      <div className="container relative z-10 text-center text-white py-20">
        <p className="text-primary font-black uppercase tracking-[0.4em] text-sm mb-4">
          Lost in the wild?
        </p>
        <h1 className="text-[180px] md:text-[240px] font-black leading-none text-white/5 select-none font-heading">
          404
        </h1>
        <div className="-mt-16 md:-mt-24 mb-10">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-heading">
            Page Not Found
          </h2>
          <p className="text-gray-400 font-medium mt-4 max-w-md mx-auto">
            This expedition leads nowhere. Let's get you back to a known trail.
          </p>
        </div>
        <Link
          to="/"
          className="inline-block bg-gradient-to-r from-primary to-[#00aeaf] text-white font-black px-10 py-4 rounded-full uppercase tracking-widest text-sm hover:opacity-90 transition shadow-2xl shadow-primary/20"
        >
          Return to Base Camp →
        </Link>
      </div>
    </div>
  );
};

export default NoPage;
