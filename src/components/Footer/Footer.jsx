import React from "react";
import FooterLogo from "../../assets/maz-logo.jpeg";

import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaWhatsapp,
  FaYoutube,
  FaReddit,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaGlobe,
  FaCcVisa,
  FaCcMastercard,
  FaShieldAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { fetchBlogs, fetchTours, fetchSiteSettings } from "../../services/api";


const importantLinks = [
  { title: "Home", link: "/" },
  { title: "About Us", link: "/about" },
  { title: "Privacy Policy", link: "/privacy-policy" },
  { title: "Terms & Conditions", link: "/terms" },
  { title: "Contact Us", link: "/contact" },
  { title: "Blog", link: "/blogs" },
];

const FALLBACK_TOURS = [
  { title: "Explore Safari Packages", link: "/packages" },
  { title: "Luxury Safari Packages", link: "/packages?type=Luxury" },
  { title: "Trekking Packages", link: "/packages?type=Trekking" },
  { title: "Day Trips", link: "/packages?type=Day Trip" },
];

const FALLBACK_BLOGS = [{ title: "Explore Travel Articles", link: "/blogs" }];

const slugifyTourTitle = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const slugifyBlogTitle = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const socialLinks = [
  { icon: <FaFacebook />, href: "https://www.facebook.com/profile.php?id=100088374186954", label: "Facebook" },
  { icon: <FaTwitter />, href: "https://twitter.com/inside_safari", label: "Twitter" },
  { icon: <FaInstagram />, href: "https://www.instagram.com/tanzania_inside_and_safari/", label: "Instagram" },
  { icon: <FaWhatsapp />, href: "https://wa.me/255762226648", label: "WhatsApp" },
  { icon: <FaYoutube />, href: "https://www.youtube.com/channel/UCCqVcrOscRAgy0XpNXlwqWQ", label: "YouTube" },
  { icon: <FaReddit />, href: "https://www.reddit.com/user/Tanzania_i_Safari", label: "Reddit" },
];

const Footer = () => {
  const [popularTours, setPopularTours] = React.useState(FALLBACK_TOURS);
  const [popularBlogs, setPopularBlogs] = React.useState(FALLBACK_BLOGS);
  const [settings, setSettings] = React.useState(null);


  React.useEffect(() => {
    const loadFooterLinks = async () => {
      try {
        const [toursRes, blogsRes, settingsRes] = await Promise.all([
          fetchTours(),
          fetchBlogs(),
          fetchSiteSettings()
        ]);
        
        if (settingsRes.data) {
          setSettings(settingsRes.data);
        }


        const tours = Array.isArray(toursRes.data) ? toursRes.data : [];
        const blogs = Array.isArray(blogsRes.data) ? blogsRes.data : [];

        if (tours.length > 0) {
          setPopularTours(
            tours.slice(0, 6).map((tour) => ({
              title: tour.title,
              link: `/packages/${slugifyTourTitle(tour.title)}?tourId=${tour._id}`,
            })),
          );
        }

        if (blogs.length > 0) {
          setPopularBlogs(
            blogs.slice(0, 6).map((blog) => ({
              title: blog.title,
              link: `/blogs/${slugifyBlogTitle(blog.title)}`,
            })),
          );
        }
      } catch (error) {
        console.error("Error loading footer links:", error);
      }
    };

    loadFooterLinks();
  }, []);

  return (
    <footer className="bg-[#1a1a1a] text-white">

      {/* ─── TOP EXEBAR: Logo | Socials | CTA ─── */}
      <div className="border-b border-white/10 overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex flex-row items-center justify-between gap-2 md:gap-4 flex-wrap sm:flex-nowrap">
          {/* Logo */}
          <Link to="/" onClick={() => window.scrollTo(0, 0)} className="shrink-0">
            <img src={FooterLogo} alt="MAZ Expeditions" className="h-10 sm:h-14 md:h-16 w-auto object-contain" />
          </Link>

          {/* Social Icons & Plan Button - Grouped for Mobile Flow */}
          <div className="flex items-center gap-3 sm:gap-6">
            <ul className="flex items-center gap-2">
              {[
                { icon: <FaFacebook />, href: settings?.facebook, label: "Facebook" },
                { icon: <FaTwitter />, href: settings?.twitter, label: "Twitter" },
                { icon: <FaInstagram />, href: settings?.instagram, label: "Instagram" },
                { icon: <FaWhatsapp />, href: settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\+/g, '')}` : "", label: "WhatsApp" },
                { icon: <FaYoutube />, href: settings?.youtube, label: "YouTube" },
                { icon: <FaReddit />, href: settings?.reddit, label: "Reddit" },
              ].filter(s => s.href).slice(0, 4).map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
                  >
                    <span className="text-xs sm:text-sm">{s.icon}</span>
                  </a>
                </li>
              ))}
            </ul>


            {/* Plan My Trip Button - Hidden on mobile if screen is tiny */}
            <Link
              to="/plan-my-trip"
              onClick={() => window.scrollTo(0, 0)}
              className="hidden sm:inline-block font-oswald uppercase tracking-widest text-[10px] md:text-sm bg-safari-green text-white px-4 md:px-6 py-2 rounded hover:bg-green-800 transition-colors"
            >
              Plan My Trip
            </Link>
          </div>
        </div>
      </div>

      {/* ─── MAIN FOOTER BODY ─── */}
      <div className="container max-w-7xl mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-10">

          {/* Column 1: Brand / Contact */}
          <div className="md:col-span-4 space-y-4">
            <h5 className="text-white font-oswald font-semibold text-base uppercase tracking-wide border-b border-safari-green pb-1">
              MAZ Expeditions
            </h5>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Tanzania-based safari experts, creating personalized African journeys with local expertise and trusted guides.
            </p>
            <div className="space-y-2 text-xs sm:text-sm">
              <a href="tel:+255762226648" className="flex items-center gap-2 text-gray-400 hover:text-safari-green transition-colors">
                <FaPhone className="text-safari-green shrink-0 text-xs" /> +255 762 226648
              </a>
              <a href="mailto:info@tanzaniainsideandsafari.com" className="flex items-center gap-2 text-gray-400 hover:text-safari-green transition-colors">
                <FaEnvelope className="text-safari-green shrink-0 text-xs" /> info@mazexpeditions.com
              </a>
            </div>
          </div>

          {/* Column 2: Two sub-columns — Important Links + Popular Tours */}
          <div className="md:col-span-8 lg:col-span-5">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 md:gap-8">
              {/* Important Links */}
              <div>
                <h5 className="text-white font-oswald font-semibold text-base uppercase tracking-wide border-b border-safari-green pb-1 mb-3">
                  Links
                </h5>
                <ul className="space-y-1.5">
                  {importantLinks.map((link) => (
                    <li key={link.title}>
                      <Link
                        to={link.link}
                        onClick={() => window.scrollTo(0, 0)}
                        className="text-gray-400 hover:text-safari-green transition-colors text-xs sm:text-sm flex items-center gap-2 group"
                      >
                        <span className="w-2 h-px bg-gray-600 group-hover:w-4 group-hover:bg-safari-green transition-all" />
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Popular Tours */}
              <div>
                <h5 className="text-white font-oswald font-semibold text-base uppercase tracking-wide border-b border-safari-green pb-1 mb-3">
                  Tours
                </h5>
                <ul className="space-y-1.5">
                  {popularTours.map((tour) => (
                    <li key={tour.title}>
                      <Link
                        to={tour.link}
                        onClick={() => window.scrollTo(0, 0)}
                        className="text-gray-400 hover:text-safari-green transition-colors text-xs sm:text-sm leading-tight flex items-start gap-2 group"
                      >
                        <span className="w-2 h-px bg-gray-600 group-hover:w-4 group-hover:bg-safari-green transition-all mt-2 shrink-0" />
                        {tour.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-2 lg:col-span-1">
                <h5 className="text-white font-oswald font-semibold text-base uppercase tracking-wide border-b border-safari-green pb-1 mb-3">
                  Blogs
                </h5>
                <ul className="space-y-1.5 flex flex-wrap lg:block gap-x-4 gap-y-1">
                  {popularBlogs.map((blog) => (
                    <li key={blog.title}>
                      <Link
                        to={blog.link}
                        onClick={() => window.scrollTo(0, 0)}
                        className="text-gray-400 hover:text-safari-green transition-colors text-xs sm:text-sm leading-tight flex items-start gap-2 group"
                      >
                        <span className="w-2 h-px bg-gray-600 group-hover:w-4 group-hover:bg-safari-green transition-all mt-2 shrink-0" />
                        {blog.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Column 3: CTA / Newsletter */}
          <div className="md:col-span-3 space-y-5">
            <h5 className="text-white font-oswald font-semibold text-lg uppercase tracking-wide border-b border-safari-green pb-2">
              Plan Your Safari
            </h5>
            <p className="text-gray-400 text-sm leading-relaxed">
              All our custom itineraries are inspired by our travel experts. We're flexible and can tailor-make an itinerary just for you.
            </p>
            <div className="flex flex-row flex-wrap items-center gap-2 mt-4">
              <Link
                to="/plan-my-trip"
                onClick={() => window.scrollTo(0, 0)}
                className="font-oswald uppercase tracking-wider text-[10px] md:text-sm bg-safari-green text-white px-3 md:px-5 py-2 md:py-2.5 rounded hover:bg-green-800 transition-colors"
              >
                Plan My Trip
              </Link>
              <Link
                to="/blogs"
                onClick={() => window.scrollTo(0, 0)}
                className="font-oswald uppercase tracking-wider text-[10px] md:text-sm border border-green-400 text-green-400 px-3 md:px-5 py-2 md:py-2.5 rounded hover:bg-green-400 hover:text-black transition-all overflow-hidden whitespace-nowrap"
              >
                Articles
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ─── PAYMENT METHODS ─── */}
      <div className="border-t border-white/10 py-4 text-center">
        <div className="flex items-center justify-center gap-4 text-5xl text-gray-400">
          <FaCcVisa className="hover:text-white transition-colors" />
          <FaCcMastercard className="hover:text-white transition-colors" />
        </div>
      </div>

      {/* ─── COPYRIGHT BOTTOM BAR ─── */}
      <div className="bg-black/40 border-t border-white/5">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
          <p className="text-gray-500 text-[10px] sm:text-xs font-medium order-2 md:order-1">
            Copyright &copy;2025 MAZ Expeditions | All rights reserved
          </p>

          <div className="flex flex-col items-center md:items-end gap-1 text-gray-300">
            <span className="font-bold text-[10px] md:text-sm uppercase tracking-widest text-[#4ade80]">
              Developed by:
            </span>
            <span className="font-black text-xs md:text-base">
              haizard@misape
            </span>
            <div className="flex items-center gap-4 text-[10px] md:text-xs font-bold mt-1">
              <a href="tel:0781071061" className="text-[#4ade80] hover:text-white transition-colors flex items-center gap-1.5 bg-white/5 py-1 px-2 rounded-full border border-white/5">
                <FaPhone size={10} className="text-[#4ade80]" /> 0781071061
              </a>
              <a href="mailto:haithammisape@gmail.com" className="text-[#4ade80] hover:text-white transition-colors flex items-center gap-1.5 bg-white/5 py-1 px-2 rounded-full border border-white/5">
                <FaEnvelope size={10} className="text-[#4ade80]" /> haithammisape@gmail.com
              </a>
            </div>
          </div>

          <Link
            to="/login"
            className="opacity-5 hover:opacity-30 transition-opacity order-3"
          >
            <FaShieldAlt size={10} className="text-gray-400" />
          </Link>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
