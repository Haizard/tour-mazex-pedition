import React from "react";
import { FaUserCircle, FaFacebookF, FaTwitter, FaInstagram, FaWhatsapp, FaYoutube, FaRedditAlien, FaChevronDown, FaPhone, FaEnvelope } from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ResponsiveMenu = ({ showMenu, setShowMenu, handleOrderPopup, menuItems = [] }) => {
  const [openSubmenu, setOpenSubmenu] = React.useState(null);

  const toggleSubmenu = (id) => {
    setOpenSubmenu(openSubmenu === id ? null : id);
  };

  return (
    <div
      className={`${showMenu ? "left-0" : "-left-[100%]"
        } fixed bottom-0 top-0 z-[2000] flex h-screen w-[75%] sm:w-[50%] flex-col justify-between bg-[#6f5336] px-6 pb-6 pt-12 text-white transition-all duration-500 md:hidden rounded-r-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-y-auto font-oswald`}
    >
      <div className="flex flex-col gap-6">
        {/* User Profile / Greeting */}
        <div className="flex items-center justify-start gap-4">
          <div className="p-3 bg-white text-[#6f5336] rounded-full shadow-lg">
            <FaUserCircle size={32} />
          </div>
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wide text-white">Hello Explorer</h1>
            <h2 className="text-xs text-white/60 lowercase italic">Welcome to Adventure</h2>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-2">
          <ul className="flex flex-col gap-2 text-sm sm:text-base uppercase font-bold tracking-wider">
            {menuItems.map((data) => {
              const hasChildren = data.children && data.children.length > 0;
              const isOpen = openSubmenu === (data._id || data.label);

              return (
                <li key={data._id || `${data.label}-${data.link}`} className="flex flex-col border-b border-gray-50 dark:border-gray-800 py-1">
                  <div className="flex items-center justify-between">
                    <Link
                      to={data.link}
                      onClick={() => !hasChildren && setShowMenu(false)}
                      className="hover:text-safari-gold text-white transition-colors flex-1"
                    >
                      {data.label}
                    </Link>
                    {hasChildren && (
                      <button
                        onClick={() => toggleSubmenu(data._id || data.label)}
                        className={`p-2 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      >
                        <FaChevronDown size={14} className="text-white/40" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Content */}
                  <AnimatePresence>
                    {hasChildren && isOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/20 rounded-xl mt-1"
                      >
                        {(data.children || []).map((child) => (
                          <li key={`${child.label}-${child.link}`}>
                            <Link
                              to={child.link}
                              onClick={() => setShowMenu(false)}
                              className="block py-3 px-4 text-[11px] font-medium text-white/80 hover:text-safari-gold border-l-2 border-transparent hover:border-safari-gold transition-all"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Action Button */}
        <div className="mt-2 pb-6">
          <button
            className="w-full bg-safari-green text-white py-3 rounded-lg font-bold uppercase tracking-wider text-xs shadow-lg hover:bg-green-800 transition-all"
            onClick={() => {
              handleOrderPopup();
              setShowMenu(false);
            }}
          >
            Plan My Trip
          </button>
        </div>
      </div>

      {/* Footer / Socials */}
      <div className="flex flex-col gap-4 border-t border-white/10 pt-6">
        <div className="flex justify-between items-center text-xl text-safari-gold">
          <a href="#" className="hover:text-white transition-colors"><FaFacebookF /></a>
          <a href="#" className="hover:text-white transition-colors"><FaTwitter /></a>
          <a href="#" className="hover:text-white transition-colors"><FaInstagram /></a>
          <a href="#" className="hover:text-white transition-colors"><FaWhatsapp /></a>
          <a href="#" className="hover:text-white transition-colors"><FaYoutube /></a>
          <a href="#" className="hover:text-white transition-colors"><FaRedditAlien /></a>
        </div>
        <div className="text-[10px] text-white/40 uppercase flex flex-col gap-1 items-center font-oswald text-center">
          <span>&copy; 2026 MAZ Expeditions</span>
          <div className="mt-2 pt-2 border-t border-white/5 w-full flex flex-col gap-1">
            <span className="text-safari-gold font-bold tracking-widest uppercase">Developed by:</span>
            <span className="text-white font-black text-xs">haizard@misape</span>
            <div className="flex items-center justify-center gap-3 mt-1">
              <a href="tel:0781071061" className="flex items-center gap-1 text-white/70 hover:text-safari-gold transition-colors text-[9px] lowercase">
                <FaPhone size={8} className="text-safari-gold" /> 0781071061
              </a>
              <a href="mailto:haithammisape@gmail.com" className="flex items-center gap-1 text-white/70 hover:text-safari-gold transition-colors text-[9px] lowercase">
                <FaEnvelope size={8} className="text-safari-gold" /> haithammisape@gmail.co
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveMenu;
