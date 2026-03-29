import React from "react";
import { motion } from "framer-motion";

const Badge = ({ children, className = "", variant = "primary" }) => {
  const variants = {
    primary: "bg-primary/20 text-primary border-primary/30",
    secondary: "bg-secondary/20 text-[#b7950b] border-secondary/30",
    accent: "bg-accent/20 text-accent border-accent/30",
    luxury:
      "bg-gradient-to-r from-secondary to-yellow-600 text-white border-none shadow-sm",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest border ${variants[variant]} ${className}`}
    >
      {children}
    </motion.span>
  );
};

export default Badge;
