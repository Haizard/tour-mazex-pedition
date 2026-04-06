import React from "react";
import { FaUserCircle, FaFacebookF, FaTwitter, FaInstagram, FaWhatsapp, FaYoutube, FaRedditAlien } from "react-icons/fa";
import { Link } from "react-router-dom";

const ResponsiveMenu = ({ showMenu, setShowMenu, handleOrderPopup, menuItems = [] }) => {
  return (
    <div
      className={`${showMenu ? "left-0" : "-left-[100%]"
        } fixed bottom-0 top-0 z-50 flex h-screen w-[75%] flex-col justify-between bg-white dark:bg-slate-900 px-8 pb-6 pt-16 text-black dark:text-white transition-all duration-300 md:hidden rounded-r-3xl shadow-2xl overflow-y-auto font-oswald`}
    >
      <div className="flex flex-col gap-8">
        {/* User Profile / Greeting */}
        <div className="flex items-center justify-start gap-4">
          <div className="p-3 bg-safari-green rounded-full text-white shadow-lg">
            <FaUserCircle size={32} />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide">Hello Explorer</h1>
            <h1 className="text-sm text-slate-500 lowercase">Welcome to Adventure</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          <ul className="flex flex-col gap-6 text-lg uppercase font-bold tracking-widest">
            {menuItems.map((data) => (
              <li key={data._id || `${data.label}-${data.link}`} className="border-b border-gray-100 dark:border-gray-800 pb-2">
                <Link
                  to={data.link}
                  onClick={() => setShowMenu(false)}
                  className="hover:text-safari-green transition-colors"
                >
                  {data.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Action Button */}
        <div className="mt-4 pb-10">
          <button 
            className="w-full bg-safari-green text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
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
      <div className="flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
        <div className="flex justify-between items-center text-xl text-safari-green">
          <a href="#"><FaFacebookF /></a>
          <a href="#"><FaTwitter /></a>
          <a href="#"><FaInstagram /></a>
          <a href="#"><FaWhatsapp /></a>
          <a href="#"><FaYoutube /></a>
          <a href="#"><FaRedditAlien /></a>
        </div>
        <div className="text-[10px] text-slate-500 uppercase flex flex-col gap-1 items-center font-oswald">
          <span>&copy; 2026 MAZ Expeditions</span>
          <span>Crafted for premium expeditions</span>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveMenu;
