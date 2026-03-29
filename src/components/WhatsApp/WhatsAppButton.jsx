import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppButton = () => {
  const phoneNumber = "+255710887798"; // From Navbar
  const message =
    "Hello Makolo Adventure Tours! I'm interested in booking a package.";

  const handleWhatsApp = () => {
    const url = `https://wa.me/${phoneNumber.replace("+", "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed bottom-6 left-6 z-[1000]">
      <button
        onClick={handleWhatsApp}
        className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 group flex items-center gap-3"
      >
        <FaWhatsapp size={32} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black uppercase text-xs tracking-widest">
          Chat on WhatsApp
        </span>
      </button>
    </div>
  );
};

export default WhatsAppButton;
