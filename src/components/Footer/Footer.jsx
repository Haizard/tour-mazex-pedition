import React from "react";
import FooterLogo from "../../assets/mazex-pedition-logo.png";
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

const importantLinks = [
  { title: "Home", link: "/" },
  { title: "About Us", link: "/about" },
  { title: "Privacy Policy", link: "/privacy-policy" },
  { title: "Terms & Conditions", link: "/terms" },
  { title: "Contact Us", link: "/contact" },
  { title: "Blog", link: "/blogs" },
];

const popularTours = [
  { title: "7 Day Kilimanjaro Trek Via Machame Route", link: "/packages" },
  { title: "All Inclusive 12-Day Tanzania Safari & Zanzibar Beach Retreat", link: "/packages" },
  { title: "Big Five & Beyond: A 7-Day Tanzania Wildlife Safari", link: "/packages" },
  { title: "All Inclusive 12 Days Honeymoon Special Safari Featuring Serengeti and Zanzibar", link: "/packages" },
  { title: "11-Day Photographic Tanzania Safari", link: "/packages" },
  { title: "8 Days Best Of Migration Safari - Mara River Crossing Experience", link: "/packages" },
];

const socialLinks = [
  { icon: <FaFacebook />, href: "https://www.facebook.com/profile.php?id=100088374186954", label: "Facebook" },
  { icon: <FaTwitter />, href: "https://twitter.com/inside_safari", label: "Twitter" },
  { icon: <FaInstagram />, href: "https://www.instagram.com/tanzania_inside_and_safari/", label: "Instagram" },
  { icon: <FaWhatsapp />, href: "https://wa.me/255762226648", label: "WhatsApp" },
  { icon: <FaYoutube />, href: "https://www.youtube.com/channel/UCCqVcrOscRAgy0XpNXlwqWQ", label: "YouTube" },
  { icon: <FaReddit />, href: "https://www.reddit.com/user/Tanzania_i_Safari", label: "Reddit" },
];

const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] text-white">

      {/* ─── TOP EXEBAR: Logo | Socials | CTA ─── */}
      <div className="border-b border-white/10">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" onClick={() => window.scrollTo(0, 0)}>
            <img src={FooterLogo} alt="Mazex Pedition" className="h-16 w-auto object-contain" />
          </Link>

          {/* Social Icons */}
          <ul className="flex items-center gap-3">
            {socialLinks.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-gray-300 hover:text-white hover:border-safari-green hover:bg-safari-green/10 transition-all duration-300 text-sm"
                >
                  {s.icon}
                </a>
              </li>
            ))}
          </ul>

          {/* Plan My Trip Button */}
          <Link
            to="/plan-my-trip"
            onClick={() => window.scrollTo(0, 0)}
            className="font-oswald uppercase tracking-widest text-sm bg-safari-green text-white px-6 py-2.5 rounded hover:bg-green-800 transition-colors duration-300 whitespace-nowrap"
          >
            Plan My Trip
          </Link>
        </div>
      </div>

      {/* ─── MAIN FOOTER BODY ─── */}
      <div className="container max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Column 1: Brand / Contact */}
          <div className="md:col-span-4 space-y-5">
            <h5 className="text-white font-oswald font-semibold text-lg uppercase tracking-wide border-b border-safari-green pb-2">
              Mazex Pedition
            </h5>
            <p className="text-gray-400 text-sm leading-relaxed">
              Mazex Pedition is a safari and expedition company based in Tanzania, dedicated to creating personalized African journeys with local expertise, trusted guides, and unforgettable wilderness experiences.
            </p>
            <div className="space-y-2.5 text-sm">
              <a href="tel:+255762226648" className="flex items-center gap-3 text-gray-400 hover:text-safari-green transition-colors">
                <FaPhone className="text-safari-green shrink-0" /> +255 762 226648
              </a>
              <a href="https://maps.app.goo.gl/2u3z3m6BExXpdqpbA" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-gray-400 hover:text-safari-green transition-colors">
                <FaMapMarkerAlt className="text-safari-green shrink-0 mt-1" />
                NSSF building 2nd Floor, Room no 14, Aga Khan Rd, Moshi, Kilimanjaro 25113
              </a>
              <a href="mailto:info@tanzaniainsideandsafari.com" className="flex items-center gap-3 text-gray-400 hover:text-safari-green transition-colors">
                <FaEnvelope className="text-safari-green shrink-0" /> info@tanzaniainsideandsafari.com
              </a>
              <a href="/" className="flex items-center gap-3 text-gray-400 hover:text-safari-green transition-colors">
                <FaGlobe className="text-safari-green shrink-0" /> Mazex Pedition
              </a>
            </div>
          </div>

          {/* Column 2: Two sub-columns — Important Links + Popular Tours */}
          <div className="md:col-span-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Important Links */}
              <div>
                <h5 className="text-white font-oswald font-semibold text-lg uppercase tracking-wide border-b border-safari-green pb-2 mb-4">
                  Important Links
                </h5>
                <ul className="space-y-2">
                  {importantLinks.map((link) => (
                    <li key={link.title}>
                      <Link
                        to={link.link}
                        onClick={() => window.scrollTo(0, 0)}
                        className="text-gray-400 hover:text-safari-green transition-colors text-sm flex items-center gap-2 group"
                      >
                        <span className="w-3 h-px bg-gray-600 group-hover:w-5 group-hover:bg-safari-green transition-all duration-300" />
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Popular Tours */}
              <div>
                <h5 className="text-white font-oswald font-semibold text-lg uppercase tracking-wide border-b border-safari-green pb-2 mb-4">
                  Popular Tours
                </h5>
                <ul className="space-y-2">
                  {popularTours.map((tour) => (
                    <li key={tour.title}>
                      <Link
                        to={tour.link}
                        onClick={() => window.scrollTo(0, 0)}
                        className="text-gray-400 hover:text-safari-green transition-colors text-sm leading-snug flex items-start gap-2 group"
                      >
                        <span className="w-3 h-px bg-gray-600 group-hover:w-5 group-hover:bg-safari-green transition-all duration-300 mt-2 shrink-0" />
                        {tour.title}
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
            <Link
              to="/plan-my-trip"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-block font-oswald uppercase tracking-wider text-sm bg-safari-green text-white px-5 py-2.5 rounded hover:bg-green-800 transition-colors duration-300"
            >
              Plan My Trip
            </Link>
            <div>
              <Link
                to="/blogs"
                onClick={() => window.scrollTo(0, 0)}
                className="inline-block font-oswald uppercase tracking-wider text-sm border border-safari-green text-safari-green px-5 py-2.5 rounded hover:bg-safari-green hover:text-white transition-all duration-300 mt-2"
              >
                Useful Articles
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
        <div className="container max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-3 text-center">
          <p className="text-gray-500 text-xs font-medium">
            Copyright &copy;2025 Mazex Pedition | All rights reserved
          </p>
          <Link
            to="/login"
            className="opacity-10 hover:opacity-40 transition-opacity"
          >
            <FaShieldAlt size={12} className="text-gray-400" />
          </Link>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
