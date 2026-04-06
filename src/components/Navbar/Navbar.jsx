import React, { useEffect, useState } from "react";
import Logo from "../../assets/mazex-pedition-logo.png";
import { NavLink, Link } from "react-router-dom";
import {
  FaCaretDown,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaWhatsapp,
  FaYoutube,
  FaRedditAlien,
} from "react-icons/fa";
import { HiMenuAlt3, HiMenuAlt1 } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import ResponsiveMenu from "./ResponsiveMenu";
import { fetchMenuItems, fetchTours } from "../../services/api";
import { FRONTEND_MENU_DEFAULTS, MENU_IMAGE_BY_KEY } from "./defaultMenuItems";

const slugifyTitle = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeValue = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase();

const getPackageTypeFromLink = (link = "") => {
  if (!link.includes("/packages")) return "";

  try {
    const url = new URL(link, "http://localhost");
    return url.searchParams.get("type") || "";
  } catch (_error) {
    const query = link.split("?")[1] || "";
    const params = new URLSearchParams(query);
    return params.get("type") || "";
  }
};

const getToursForMenuItem = (item, tours) => {
  const typeFromLink = normalizeValue(getPackageTypeFromLink(item.link));
  const itemKey = normalizeValue(item.categoryKey || item.label);
  const isPackageMenu = normalizeValue(item.link).includes("/packages");

  if (!isPackageMenu) return [];

  return tours.filter((tour) => {
    const tourType = normalizeValue(tour.tourType);
    const tourCategory = normalizeValue(tour.category);

    if (typeFromLink && (tourType === typeFromLink || tourCategory === typeFromLink)) {
      return true;
    }

    if (itemKey && (tourType.includes(itemKey) || tourCategory.includes(itemKey))) {
      return true;
    }

    return false;
  });
};

const buildMenuWithLiveTours = (menuItems, tours) =>
  menuItems.map((item) => {
    if (item.itemType === "link") return item;

    const matchedTours = getToursForMenuItem(item, tours);
    if (!matchedTours.length) return item;

    return {
      ...item,
      children: matchedTours.slice(0, 12).map((tour, index) => ({
        label: tour.title,
        link: `/packages/${slugifyTitle(tour.title)}?tourId=${tour._id}`,
        sortOrder: index + 1,
      })),
    };
  });

const Navbar = ({ handleOrderPopup }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuItems, setMenuItems] = useState(FRONTEND_MENU_DEFAULTS);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const [menuRes, toursRes] = await Promise.all([fetchMenuItems(), fetchTours()]);
        const menuData =
          Array.isArray(menuRes.data) && menuRes.data.length > 0
            ? menuRes.data
            : FRONTEND_MENU_DEFAULTS;
        const toursData = Array.isArray(toursRes.data) ? toursRes.data : [];

        if (menuData.length > 0) {
          setMenuItems(buildMenuWithLiveTours(menuData, toursData));
        }
      } catch (error) {
        console.error("Error loading menu items:", error);
      }
    };

    loadMenuItems();
  }, []);

  const toggleMenu = () => setShowMenu(!showMenu);

  return (
    <nav className="fixed top-0 w-full z-[1000] font-oswald">
      <div
        className={`hidden md:block bg-[#6f5336] text-white border-b border-white/10 overflow-hidden transition-all duration-300 ${
          isScrolled ? "max-h-0 py-0 opacity-0" : "max-h-24 py-3 opacity-100"
        }`}
      >
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="hover:text-safari-gold transition-colors"><FaFacebookF /></a>
            <a href="#" className="hover:text-safari-gold transition-colors"><FaTwitter /></a>
            <a href="#" className="hover:text-safari-gold transition-colors"><FaInstagram /></a>
            <a href="#" className="hover:text-safari-gold transition-colors"><FaWhatsapp /></a>
            <a href="#" className="hover:text-safari-gold transition-colors"><FaYoutube /></a>
            <a href="#" className="hover:text-safari-gold transition-colors"><FaRedditAlien /></a>
          </div>

          <div className="flex-1 flex justify-center">
            <button
              onClick={handleOrderPopup}
              className="bg-safari-green text-white px-8 py-1.5 rounded-lg text-sm font-medium tracking-wider hover:bg-opacity-90 transition-all shadow-md transform hover:scale-105 active:scale-95"
            >
              PLAN MY TRIP
            </button>
          </div>

          <div className="flex items-center gap-6 text-[13px] font-medium uppercase tracking-tighter">
            <select className="bg-transparent border-none outline-none cursor-pointer focus:ring-0 text-white">
              <option>English UK</option>
              <option>Germany DE</option>
            </select>
            <Link to="/about" className="hover:text-safari-gold transition-colors">About Us</Link>
            <select className="bg-transparent border-none outline-none cursor-pointer focus:ring-0 max-w-[150px] text-white" defaultValue="Practical Info">
              <option disabled>Practical Info</option>
              <option>Privacy Policy</option>
              <option>Terms & Conditions</option>
              <option>Safari FAQs</option>
            </select>
          </div>
        </div>
      </div>

      <div
        className={`w-full py-5 border-b shadow-lg transition-all duration-300 ${
          isScrolled
            ? "bg-[#f4ede3] border-[#d8c7b4]"
            : "bg-[#6f5336] border-white/10"
        }`}
      >
        <div className="container mx-auto flex justify-between items-center px-4">
          <Link to="/" className="flex items-center" onClick={() => window.scrollTo(0, 0)}>
            <img
              src={Logo}
              alt="Logo"
              className={`h-16 md:h-20 rounded-full shadow-2xl transition-all duration-300 ${
                isScrolled ? "border-2 border-[#6f5336]/20" : "border-2 border-white/20"
              }`}
            />
          </Link>

          <div className="hidden lg:block">
            <ul
              className={`flex items-center gap-6 xl:gap-8 ${
                isScrolled ? "text-[#2f2418]" : "text-white"
              }`}
            >
              {menuItems.map((item) => (
                <li
                  key={item._id || `${item.label}-${item.link}`}
                  className="relative group"
                  onMouseEnter={() => setActiveMenu(item.categoryKey || null)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <NavLink
                    to={item.link}
                    className={({ isActive }) =>
                      `flex items-center gap-1 text-[13px] xl:text-[14px] font-bold uppercase tracking-wider transition-all duration-300 ${
                        isActive
                          ? "text-safari-gold"
                          : isScrolled
                            ? "text-[#2f2418] hover:text-[#8b5e34]"
                            : "text-white hover:text-safari-gold"
                      }`
                    }
                  >
                    {item.label}
                    {item.itemType !== "link" && (
                      <FaCaretDown className="transition-transform duration-300 group-hover:rotate-180" />
                    )}
                  </NavLink>

                  <AnimatePresence>
                    {activeMenu === item.categoryKey && item.itemType !== "link" && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 transition-all duration-300 ${
                          item.itemType === "megamenu" ? "w-[820px] max-w-[88vw]" : "w-[260px] max-w-[84vw]"
                        } bg-white text-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-100 z-[2000]`}
                      >
                        {item.itemType === "megamenu" ? (
                          <div className="flex h-[350px]">
                            <div className="w-1/2 p-8 grid grid-cols-1 gap-4 overflow-y-auto scrollbar-hide">
                              <h5 className="text-safari-green border-b border-gray-100 pb-2 mb-2 font-black uppercase text-sm tracking-widest">
                                {item.menuTitle}
                              </h5>
                              {(item.children || []).map((child) => (
                                <Link
                                  key={`${child.label}-${child.link}`}
                                  to={child.link}
                                  className="text-sm font-medium hover:text-safari-green hover:pl-2 transition-all duration-300"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                            <div className="w-1/2 relative">
                              <img
                                src={MENU_IMAGE_BY_KEY[item.imageKey] || MENU_IMAGE_BY_KEY.tembo}
                                alt={item.label}
                                className="absolute inset-0 w-full h-full object-fill"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 flex flex-col gap-3">
                            {(item.children || []).map((child) => (
                              <Link
                                key={`${child.label}-${child.link}`}
                                to={child.link}
                                className="text-sm font-medium hover:text-safari-green transition-all"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className={`transition-colors ${
                isScrolled
                  ? "text-[#2f2418] hover:text-[#8b5e34]"
                  : "text-white hover:text-safari-gold"
              }`}
            >
              {showMenu ? <HiMenuAlt1 size={32} /> : <HiMenuAlt3 size={32} />}
            </button>
          </div>
        </div>
      </div>

      <ResponsiveMenu
        setShowMenu={setShowMenu}
        showMenu={showMenu}
        handleOrderPopup={handleOrderPopup}
        menuItems={menuItems}
      />
    </nav>
  );
};

export default Navbar;
