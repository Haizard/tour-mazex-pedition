import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppButton = () => {
  const phoneNumber = "+255710887798"; // From Navbar
  const message =
    "Hello MAZ Expeditions! I'm interested in booking a package.";

  const handleWhatsApp = () => {
    const url = `https://wa.me/${phoneNumber.replace("+", "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed bottom-4 left-4 z-[1000]">
      <button
        onClick={handleWhatsApp}
        className="bg-[#25D366] text-white p-3 rounded-full shadow-xl hover:scale-110 transition-all duration-300 group flex items-center gap-2"
      >
        <FaWhatsapp size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black uppercase text-[10px] tracking-widest leading-none">
          WhatsApp
        </span>
      </button>
    </div>
  );
};

export default WhatsAppButton;
