import React from "react";
import { Link } from "react-router-dom";
import {
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaPhone,
  FaReddit,
  FaShieldAlt,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import FooterLogo from "../../assets/maz-logo.jpeg";
import { fetchBlogs, fetchSiteSettings, fetchTours } from "../../services/api";
import { useTenant } from "../../context/TenantContext";
import { useRouteData } from "../../utils/routeData.jsx";
import { buildTenantScopedPath, buildTenantScopedTourPath } from "../../utils/tenantRoutes.js";

const LEGACY_LINKS = [
  { title: "Home", link: "/" },
  { title: "About Us", link: "/about" },
  { title: "Privacy Policy", link: "/privacy-policy" },
  { title: "Terms & Conditions", link: "/terms" },
  { title: "Contact Us", link: "/contact" },
  { title: "Blog", link: "/blogs" },
];

const LEGACY_TOURS = [
  { title: "Explore Safari Packages", link: "/packages" },
  { title: "Luxury Safari Packages", link: "/packages?type=Luxury" },
  { title: "Trekking Packages", link: "/packages?type=Trekking" },
  { title: "Day Trips", link: "/packages?type=Day Trip" },
];

const PLATFORM_LINKS = [
  { title: "Features", link: "/features" },
  { title: "Marketplace", link: "/discover" },
  { title: "Pricing", link: "/pricing" },
  { title: "How It Works", link: "/how-it-works" },
];

const PLATFORM_BLOGS = [
  { title: "For Operators", link: "/operators" },
  { title: "Affiliate Partners", link: "/partners" },
  { title: "Demo Tenant", link: "/demo/mazexpeditions" },
  { title: "Platform Admin", link: "/platform/login" },
  { title: "Security", link: "/security" },
];

const slugifyTitle = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const socialItems = (settings = {}) => [
  { icon: <FaFacebook />, href: settings.facebook, label: "Facebook" },
  { icon: <FaTwitter />, href: settings.twitter, label: "Twitter" },
  { icon: <FaInstagram />, href: settings.instagram, label: "Instagram" },
  {
    icon: <FaWhatsapp />,
    href: settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\+/g, "")}` : "",
    label: "WhatsApp",
  },
  { icon: <FaYoutube />, href: settings.youtube, label: "YouTube" },
  { icon: <FaReddit />, href: settings.reddit, label: "Reddit" },
].filter((item) => item.href);

const Footer = () => {
  const { siteConfig, tenant, loading, isPlatform } = useTenant();
  const isLegacyTenant = !loading && !isPlatform && (!tenant || tenant.slug === "maz-expeditions");
  const routeData = useRouteData();
  const sharedData = routeData.shared || {};
  const footerConfig = siteConfig?.footerConfig || {};
  const [settings, setSettings] = React.useState(sharedData.siteSettings || null);
  const [popularTours, setPopularTours] = React.useState([]);
  const [popularBlogs, setPopularBlogs] = React.useState([]);
  const currentPathname =
    typeof window !== "undefined" ? window.location.pathname : "";

  React.useEffect(() => {
    setSettings(sharedData.siteSettings || null);
  }, [sharedData.siteSettings]);

  React.useEffect(() => {
    let active = true;

    const loadFooterData = async () => {
      if (isPlatform) {
        setPopularTours([]);
        setPopularBlogs(PLATFORM_BLOGS);
        setSettings(null);
        return;
      }

      try {
        const [toursRes, blogsRes, settingsRes] = await Promise.all([
          fetchTours(),
          fetchBlogs(),
          fetchSiteSettings(),
        ]);

        if (!active) return;

        const tours = Array.isArray(toursRes.data) ? toursRes.data : [];
        const blogs = Array.isArray(blogsRes.data) ? blogsRes.data : [];

        setSettings(settingsRes.data || null);
        setPopularTours(
          tours.slice(0, 6).map((tour) => ({
            title: tour.title,
            link: buildTenantScopedTourPath(tour, currentPathname),
          }))
        );
        setPopularBlogs(
          blogs.slice(0, 6).map((blog) => ({
            title: blog.title,
            link: buildTenantScopedPath(`/blogs/${slugifyTitle(blog.title)}`, currentPathname),
          }))
        );
      } catch (error) {
        console.error("Error loading footer links:", error);
      }
    };

    loadFooterData();

    return () => {
      active = false;
    };
  }, [isPlatform]);

  const brandName =
    footerConfig.brandName ||
    tenant?.name ||
    (isPlatform ? "MAZ Expeditions Platform" : isLegacyTenant ? "MAZ Expeditions" : "");
  const brandDescription =
    footerConfig.brandDescription ||
    (isPlatform
      ? "An AI-powered tourism growth platform for operators, marketplace discovery, WhatsApp sales, booking automation, and commission partnerships."
      :
    (isLegacyTenant
      ? "Tanzania-based safari experts, creating personalized African journeys with local expertise and trusted guides."
      : ""));
  const links = isPlatform ? PLATFORM_LINKS : isLegacyTenant ? LEGACY_LINKS : [];
  const tours = popularTours.length ? popularTours : isPlatform ? [] : isLegacyTenant ? LEGACY_TOURS : [];
  const blogs = popularBlogs.length
    ? popularBlogs
    : isPlatform
      ? PLATFORM_BLOGS
    : isLegacyTenant
      ? [{ title: "Explore Travel Articles", link: buildTenantScopedPath("/blogs", currentPathname) }]
      : [];
  const primaryLabel = footerConfig.primaryCtaLabel || (isPlatform ? "Explore Marketplace" : isLegacyTenant ? "Plan My Trip" : "");
  const primaryHref = footerConfig.primaryCtaHref || (isPlatform ? "/discover" : isLegacyTenant ? "/plan-my-trip" : "");
  const secondaryLabel = footerConfig.secondaryCtaLabel || (isPlatform ? "See Pricing" : isLegacyTenant ? "Articles" : "");
  const secondaryHref = footerConfig.secondaryCtaHref || (isPlatform ? "/pricing" : isLegacyTenant ? "/blogs" : "");
  const scopedPrimaryHref = isPlatform ? primaryHref : buildTenantScopedPath(primaryHref, currentPathname);
  const scopedSecondaryHref = isPlatform ? secondaryHref : buildTenantScopedPath(secondaryHref, currentPathname);
  const scopedHomeHref = isPlatform ? "/" : buildTenantScopedPath("/", currentPathname);
  const socials = socialItems(settings || {});
  const hasVisibleContent =
    brandName ||
    brandDescription ||
    settings?.logoUrl ||
    socials.length ||
    links.length ||
    tours.length ||
    blogs.length ||
    primaryLabel ||
    secondaryLabel;

  if (!isLegacyTenant && !hasVisibleContent) {
    return null;
  }

  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="border-b border-white/10">
        <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          {(settings?.logoUrl || isLegacyTenant || isPlatform) && (
            <Link to={scopedHomeHref} onClick={() => window.scrollTo(0, 0)} className="shrink-0">
              <img
                src={settings?.logoUrl || FooterLogo}
                alt={brandName || "Tenant logo"}
                className="h-12 w-auto object-contain mix-blend-multiply brightness-110"
              />
            </Link>
          )}

          <div className="flex items-center gap-3">
            {socials.slice(0, 6).map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:text-white"
              >
                {item.icon}
              </a>
            ))}
            {primaryLabel && primaryHref && (
              <Link
                to={scopedPrimaryHref}
                onClick={() => window.scrollTo(0, 0)}
                className="hidden rounded bg-safari-green px-5 py-2 font-oswald text-xs uppercase tracking-widest text-white transition hover:bg-green-800 sm:inline-block"
              >
                {primaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-12">
        <div className="space-y-4 md:col-span-4">
          {brandName && (
            <h5 className="border-b border-safari-green pb-2 font-oswald text-base font-semibold uppercase tracking-wide">
              {brandName}
            </h5>
          )}
          {brandDescription && (
            <p className="max-w-sm text-sm leading-relaxed text-gray-400">
              {brandDescription}
            </p>
          )}
          {isLegacyTenant && (
            <div className="space-y-2 text-sm">
              <a href="tel:+255762226648" className="flex items-center gap-2 text-gray-400 hover:text-safari-green">
                <FaPhone className="text-safari-green" /> +255 762 226648
              </a>
              <a href="mailto:info@mazexpeditions.com" className="flex items-center gap-2 text-gray-400 hover:text-safari-green">
                <FaEnvelope className="text-safari-green" /> info@mazexpeditions.com
              </a>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8 md:col-span-5 lg:grid-cols-3">
          {[
            { title: "Links", items: links },
            { title: "Tours", items: tours },
            { title: "Blogs", items: blogs },
          ].map((group) => (
            group.items.length > 0 && (
              <div key={group.title}>
                <h5 className="mb-3 border-b border-safari-green pb-2 font-oswald text-base font-semibold uppercase tracking-wide">
                  {group.title}
                </h5>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={`${group.title}-${item.title}`}>
                      <Link
                        to={item.link}
                        onClick={() => window.scrollTo(0, 0)}
                        className="text-sm text-gray-400 transition hover:text-safari-green"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ))}
        </div>

        <div className="space-y-5 md:col-span-3">
          <h5 className="border-b border-safari-green pb-2 font-oswald text-lg font-semibold uppercase tracking-wide">
            {footerConfig.ctaTitle || (isPlatform ? "Explore The Network" : isLegacyTenant ? "Plan Your Safari" : "Contact")}
          </h5>
          {(footerConfig.ctaDescription || isLegacyTenant) && (
            <p className="text-sm leading-relaxed text-gray-400">
              {footerConfig.ctaDescription ||
                "All our custom itineraries are inspired by our travel experts and can be tailor-made for you."}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {primaryLabel && primaryHref && (
              <Link
                to={scopedPrimaryHref}
                onClick={() => window.scrollTo(0, 0)}
                className="rounded bg-safari-green px-4 py-2 font-oswald text-xs uppercase tracking-wider text-white transition hover:bg-green-800"
              >
                {primaryLabel}
              </Link>
            )}
            {secondaryLabel && secondaryHref && (
              <Link
                to={scopedSecondaryHref}
                onClick={() => window.scrollTo(0, 0)}
                className="rounded border border-green-400 px-4 py-2 font-oswald text-xs uppercase tracking-wider text-green-400 transition hover:bg-green-400 hover:text-black"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 bg-black/40">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 text-center md:flex-row">
          <p className="text-xs font-medium text-gray-500">
            {footerConfig.copyrightLabel ||
              (isLegacyTenant
                ? "Copyright ©2025 MAZ Expeditions | All rights reserved"
                : `Copyright ©${new Date().getFullYear()} ${brandName}`)}
          </p>

          <Link to={isPlatform ? "/platform/login" : "/login"} className="opacity-5 transition-opacity hover:opacity-30">
            <FaShieldAlt size={10} className="text-gray-400" />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
