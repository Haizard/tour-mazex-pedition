import React, { useEffect, useState } from "react";
import Logo from "../../assets/maz-logo.jpeg";

import { NavLink, Link, useNavigate } from "react-router-dom";
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
import { fetchMenuItems, fetchTours, fetchSiteSettings } from "../../services/api";
import { useTenant } from "../../context/TenantContext";
import { useRouteData } from "../../utils/routeData.jsx";

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
    const tourType = normalizeValue(tour.tourType || "");
    const tourCategory = normalizeValue(tour.category || "");
    const tourTitle = normalizeValue(tour.title || "");

    // Check if it's a Chimpanzee or Primate tour
    const isChimpTour =
      tourTitle.includes("chimpanzee") ||
      tourTitle.includes("gombe") ||
      tourTitle.includes("mahale") ||
      tourType.includes("chimpanzee") ||
      tourCategory.includes("chimpanzee");

    // Check if it's a Kilimanjaro tour
    const isKiliTour =
      tourTitle.includes("kilimanjaro") ||
      tourTitle.includes("route") ||
      tourType.includes("kilimanjaro") ||
      tourCategory.includes("kilimanjaro");

    const itemLabel = normalizeValue(item.label);
    const isChimpMenu = itemKey.includes("chimpanzee") || itemLabel.includes("chimpanzee");
    const isKiliMenu = itemKey.includes("kilimanjaro") || itemLabel.includes("kilimanjaro");

    // Enforce strict separation
    if (isChimpMenu) return isChimpTour;
    if (isKiliMenu) return isKiliTour;

    // Normal logic for other categories (Safari, Day Trips, etc.)
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
  const navigate = useNavigate();
  const { siteConfig, tenant } = useTenant();
  const routeData = useRouteData();
  const sharedData = routeData.shared || {};
  const shouldUseDefaultMenu = !tenant || tenant.slug === "maz-expeditions";
  const isLegacyTenant = shouldUseDefaultMenu;
  const initialTours = React.useMemo(() => 
    Array.isArray(sharedData.tours) ? sharedData.tours : [], 
  [sharedData.tours]);

  const initialSettings = React.useMemo(() => 
    sharedData.siteSettings || null,
  [sharedData.siteSettings]);

  const initialMenuItems = React.useMemo(() => {
    const menuData =
      Array.isArray(sharedData.menuItems) && sharedData.menuItems.length > 0
        ? sharedData.menuItems
        : shouldUseDefaultMenu
          ? FRONTEND_MENU_DEFAULTS
          : [];

    return buildMenuWithLiveTours(menuData, initialTours);
  }, [initialTours, sharedData.menuItems, shouldUseDefaultMenu]);

  const [showMenu, setShowMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [settings, setSettings] = useState(initialSettings);

  // Sync state with initial data when it changes (efficiently)
  useEffect(() => {
    setMenuItems(initialMenuItems);
  }, [initialMenuItems]);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

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
        const [menuRes, toursRes, settingsRes] = await Promise.all([
          fetchMenuItems(),
          fetchTours(),
          fetchSiteSettings()
        ]);
        
        if (settingsRes.data) {
          setSettings(settingsRes.data);
        }

        const menuData =
          Array.isArray(menuRes.data) && menuRes.data.length > 0
            ? menuRes.data
            : shouldUseDefaultMenu
              ? FRONTEND_MENU_DEFAULTS
              : [];
        const toursData = Array.isArray(toursRes.data) ? toursRes.data : initialTours;

        setMenuItems(buildMenuWithLiveTours(menuData, toursData));
      } catch (error) {
        console.error("Error loading menu items:", error);
      }
    };

    // Only load if we don't have enough initial data or on mount
    if (menuItems.length === 0 || initialTours.length === 0) {
       loadMenuItems();
    }
  }, [shouldUseDefaultMenu]); // Refresh when tenant context resolves for demo tenants.

  const navigationConfig = siteConfig?.navigationConfig || {};

  const handlePrimaryCta = () => {
    const href = navigationConfig.ctaHref || (isLegacyTenant ? "/plan-my-trip" : "");
    if (!href) return;
    if (href === "popup") {
      handleOrderPopup();
      return;
    }

    navigate(href);
    window.scrollTo(0, 0);
  };

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
            {settings?.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-safari-gold transition-colors"><FaFacebookF /></a>}
            {settings?.twitter && <a href={settings.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-safari-gold transition-colors"><FaTwitter /></a>}
            {settings?.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-safari-gold transition-colors"><FaInstagram /></a>}
            {settings?.whatsapp && <a href={`https://wa.me/${settings.whatsapp.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-safari-gold transition-colors"><FaWhatsapp /></a>}
            {settings?.youtube && <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-safari-gold transition-colors"><FaYoutube /></a>}
            {settings?.reddit && <a href={settings.reddit} target="_blank" rel="noopener noreferrer" className="hover:text-safari-gold transition-colors"><FaRedditAlien /></a>}
          </div>

          <div className="flex-1 flex justify-center">
            {(navigationConfig.ctaLabel || isLegacyTenant) && (
              <button
                onClick={handlePrimaryCta}
                className="bg-safari-green text-white px-8 py-1.5 rounded-lg text-sm font-medium tracking-wider hover:bg-opacity-90 transition-all shadow-md transform hover:scale-105 active:scale-95"
              >
                {navigationConfig.ctaLabel || "PLAN MY TRIP"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-6 text-[13px] font-medium uppercase tracking-tighter">
            {isLegacyTenant && (
              <select className="bg-transparent border-none outline-none cursor-pointer focus:ring-0 text-white">
                <option>English UK</option>
                <option>Germany DE</option>
              </select>
            )}
            {(navigationConfig.aboutLabel || isLegacyTenant) && (
              <Link to={navigationConfig.aboutHref || "/about"} className="hover:text-safari-gold transition-colors">
                {navigationConfig.aboutLabel || "About Us"}
              </Link>
            )}
            {isLegacyTenant && (
              <select className="bg-transparent border-none outline-none cursor-pointer focus:ring-0 max-w-[150px] text-white" defaultValue="Practical Info">
                <option disabled>Practical Info</option>
                <option>Privacy Policy</option>
                <option>Terms & Conditions</option>
                <option>Safari FAQs</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <div
        className={`w-full py-2.5 md:py-5 border-b shadow-lg transition-all duration-300 ${
          isScrolled
            ? "bg-[#f4ede3] border-[#d8c7b4]"
            : "bg-[#6f5336] border-white/10"
        }`}
      >
        <div className="container mx-auto flex justify-between items-center px-4">
          <Link to="/" className="flex items-center" onClick={() => window.scrollTo(0, 0)}>
            {(settings?.logoUrl || isLegacyTenant) ? (
              <img
                src={settings?.logoUrl || Logo}
                alt="Logo"
                className={`h-12 sm:h-14 md:h-20 rounded-full shadow-2xl transition-all duration-300 ${
                  isScrolled ? "border-2 border-[#6f5336]/20" : "border-2 border-white/20"
                }`}
              />
            ) : (
              <span className={`font-black uppercase tracking-widest ${isScrolled ? "text-[#2f2418]" : "text-white"}`}>
                {tenant?.name || "Tenant"}
              </span>
            )}
          </Link>

          <div className="hidden lg:block">
            <ul
              className={`flex items-center gap-6 xl:gap-8 ${
                isScrolled ? "text-[#2f2418]" : "text-white"
              }`}
            >
              {menuItems.map((item, index) => (
                <li
                  key={`${item.label}-${index}`}
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
                        initial={false}
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
                                  className="text-[13px] xl:text-[14px] font-bold uppercase tracking-wider hover:text-safari-green hover:pl-2 transition-all duration-300"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                            <div className="w-1/2 relative">
                              <img
                                src={
                                  normalizeValue(item.label).includes("chimpanzee")
                                    ? MENU_IMAGE_BY_KEY.primate
                                    : MENU_IMAGE_BY_KEY[item.imageKey] || MENU_IMAGE_BY_KEY.tembo
                                }
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
                                className="text-[13px] xl:text-[14px] font-bold uppercase tracking-wider hover:text-safari-green transition-all"
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
        settings={settings}
        navigationConfig={navigationConfig}
      />
    </nav>
  );
};

export default Navbar;
