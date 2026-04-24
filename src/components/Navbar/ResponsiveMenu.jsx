import React from "react";
import {
  FaUserCircle,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaWhatsapp,
  FaYoutube,
  FaRedditAlien,
  FaChevronDown,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ResponsiveMenu = ({
  showMenu,
  setShowMenu,
  handleOrderPopup,
  menuItems = [],
  settings,
  navigationConfig = {},
  footerConfig = {},
  brandName = "",
}) => {
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = React.useState(null);
  const mobileCopyright =
    footerConfig.mobileCopyrightLabel ||
    footerConfig.copyrightLabel ||
    `Copyright ${new Date().getFullYear()} ${brandName || "Tenant Website"}`;
  const menuHeading = brandName || footerConfig.brandName || "Website Menu";
  const menuSubheading =
    navigationConfig.aboutLabel || footerConfig.brandDescription || "Explore this website";

  const toggleSubmenu = (id) => {
    setOpenSubmenu(openSubmenu === id ? null : id);
  };

  const handlePrimaryCta = () => {
    const href = navigationConfig.ctaHref || "";
    if (!href) {
      setShowMenu(false);
      return;
    }
    if (href === "popup") {
      handleOrderPopup();
    } else {
      navigate(href);
      window.scrollTo(0, 0);
    }
    setShowMenu(false);
  };

  return (
    <div
      className={`${
        showMenu ? "left-0" : "-left-[100%]"
      } fixed bottom-0 top-0 z-[2000] flex h-screen w-[75%] sm:w-[50%] flex-col justify-between overflow-y-auto rounded-r-2xl bg-[#6f5336] px-6 pb-6 pt-12 font-oswald text-white shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 md:hidden`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-start gap-4">
          <div className="rounded-full bg-white p-3 text-[#6f5336] shadow-lg">
            <FaUserCircle size={32} />
          </div>
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wide text-white">{menuHeading}</h1>
            <h2 className="text-xs italic text-white/60">{menuSubheading}</h2>
          </div>
        </div>

        <nav className="mt-2">
          <ul className="flex flex-col gap-2 text-sm font-bold uppercase tracking-wider sm:text-base">
            {menuItems.map((data) => {
              const hasChildren = data.children && data.children.length > 0;
              const isOpen = openSubmenu === (data._id || data.label);

              return (
                <li
                  key={data._id || `${data.label}-${data.link}`}
                  className="flex flex-col border-b border-gray-50 py-1 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      to={data.link}
                      onClick={() => !hasChildren && setShowMenu(false)}
                      className="flex-1 text-white transition-colors hover:text-safari-gold"
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

                  <AnimatePresence>
                    {hasChildren && isOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-1 overflow-hidden rounded-xl bg-black/20"
                      >
                        {(data.children || []).map((child) => (
                          <li key={`${child.label}-${child.link}`}>
                            <Link
                              to={child.link}
                              onClick={() => setShowMenu(false)}
                              className="block border-l-2 border-transparent px-4 py-3 text-sm font-bold uppercase tracking-wider text-white/80 transition-all hover:border-safari-gold hover:text-safari-gold sm:text-base"
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

        {navigationConfig.ctaLabel && navigationConfig.ctaHref && (
          <div className="mt-2 pb-6">
            <button
              className="w-full rounded-lg bg-safari-green py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-green-800"
              onClick={handlePrimaryCta}
            >
              {navigationConfig.ctaLabel}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-white/10 pt-6">
        <div className="flex items-center justify-between text-xl text-safari-gold">
          {settings?.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white"><FaFacebookF /></a>}
          {settings?.twitter && <a href={settings.twitter} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white"><FaTwitter /></a>}
          {settings?.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white"><FaInstagram /></a>}
          {settings?.whatsapp && <a href={`https://wa.me/${settings.whatsapp.replace(/\+/g, "")}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white"><FaWhatsapp /></a>}
          {settings?.youtube && <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white"><FaYoutube /></a>}
          {settings?.reddit && <a href={settings.reddit} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white"><FaRedditAlien /></a>}
        </div>
        <div className="text-center font-oswald text-[10px] uppercase text-white/40">
          <span>{mobileCopyright}</span>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveMenu;
