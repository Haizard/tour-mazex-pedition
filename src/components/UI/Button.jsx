import React from "react";
import { motion } from "framer-motion";

const Button = ({
  children,
  onClick,
  className = "",
  variant = "primary",
  ...props
}) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-primary to-[#00aeaf] text-white cinematic-shadow",
    secondary: "bg-gradient-to-r from-secondary to-[#d4ac0d] text-gray-900",
    outline: "border-2 border-primary text-primary hover:bg-primary/10",
    accent: "bg-accent text-white",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-6 py-3 rounded-full font-bold transition-all duration-300 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
