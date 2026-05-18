import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { IoChevronDownOutline, IoLocationOutline } from "react-icons/io5";
import { fetchBlogs, fetchTours } from "../services/api";
import { getDestinationBySlug } from "../data/destinations";
import SEO from "../components/UI/SEO";
import Badge from "../components/UI/Badge";
import PackageCard from "../components/Blogs/PackageCard";
import Testimonial from "../components/Testimonial/Testimonial";
import TripCTA from "../components/Home/TripCTA";
import LogoSlider from "../components/Home/LogoSlider";
import {
  buildBreadcrumbSchema,
  buildDestinationSchema,
  buildFaqSchema,
  resolveCanonicalUrl,
} from "../utils/seo";
import {
  buildDestinationFaqs,
  matchDestinationBlog,
  matchDestinationTours,
} from "../utils/contentMatchers";
import { useRouteData } from "../utils/routeData.jsx";
import {
  buildTenantScopedPath,
  buildTenantScopedTourPath,
} from "../utils/tenantRoutes.js";

const slugify = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const buildCmsFallbackMarkdown = (destination) => `#### Destination Content Coming Soon

This page is now CMS-driven for strict destination accuracy.

#### What This Means

Only blogs and tours explicitly assigned to **${destination.title}** will appear on this page. This avoids unrelated safari copy, tours, or FAQs from showing up here.

#### Next Step In Admin

Assign a destination tag to the correct blog article and destination tours in the admin panel to publish the final destination guide for ${destination.title}.
`;

const DestinationDetail = () => {
  const { destinationSlug } = useParams();
  const location = useLocation();
  const destination = getDestinationBySlug(destinationSlug);
  const routeData = useRouteData();
  const [blog, setBlog] = useState(routeData.destinationDetail?.blog || null);
  const [relatedTours, setRelatedTours] = useState(routeData.destinationDetail?.relatedTours || []);
  const [faqs, setFaqs] = useState(routeData.destinationDetail?.faqs || []);
  const [loading, setLoading] = useState(!destination);
  const [openFaqIndex, setOpenFaqIndex] = useState(
    routeData.destinationDetail?.faqs?.length ? 0 : -1,
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [destinationSlug]);

  useEffect(() => {
    const loadDestinationPage = async () => {
      if (!destination) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [blogsRes, toursRes] = await Promise.all([fetchBlogs(), fetchTours()]);
        const matchedBlog = matchDestinationBlog(blogsRes.data, destination);
        const matchedTours = matchDestinationTours(toursRes.data, destination);
        const destinationFaqs = buildDestinationFaqs(matchedTours);

        setBlog(matchedBlog);
        setRelatedTours(matchedTours);
        setFaqs(destinationFaqs);
        setOpenFaqIndex(destinationFaqs.length ? 0 : -1);
      } catch (error) {
        console.error("Destination page load failed:", error);
        setBlog(null);
        setRelatedTours([]);
        setFaqs([]);
        setOpenFaqIndex(-1);
      } finally {
        setLoading(false);
      }
    };

    if (!routeData.destinationDetail?.blog && !routeData.destinationDetail?.relatedTours?.length) {
      loadDestinationPage();
    }
  }, [destination]);

  const articleContent = useMemo(() => {
    if (!destination) return "";
    return blog?.content || buildCmsFallbackMarkdown(destination);
  }, [blog, destination]);
  const canonicalPath = destination ? `/destinations/${destination.slug}` : "/destinations";
  const destinationFaqs = faqs.length ? faqs : destination?.fallbackFaqs || [];
  const canonicalUrl = resolveCanonicalUrl(blog?.seo?.canonicalUrl, canonicalPath);
  const pageSchema = destination
    ? [
        buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Destinations", path: "/destinations" },
          { name: destination.title, path: canonicalPath },
        ]),
        buildDestinationSchema(
          destination,
          canonicalPath,
          blog?.seo?.description || destination.intro,
          blog?.seo?.ogImage || blog?.image || destination.image,
        ),
        buildFaqSchema(destinationFaqs),
      ]
    : [];

  if (loading) {
    return <div className="py-24 text-center">Loading destination...</div>;
  }

  if (!destination) {
    return <div className="py-24 text-center">Destination not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-24">
      <SEO
        title={blog?.seo?.title || destination.title}
        description={blog?.seo?.description || destination.intro}
        keywords={blog?.seo?.keywords || destination.aliases}
        ogImage={blog?.seo?.ogImage || blog?.image || destination.image}
        canonicalUrl={canonicalUrl}
        schema={[...pageSchema, blog?.seo?.schema]}
        type="article"
      />

      <section
        className="relative flex min-h-[360px] items-center overflow-hidden bg-cover bg-center md:min-h-[460px]"
        style={{ backgroundImage: `url('${blog?.image || destination.image}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/68 to-black/55" />
        <div className="container relative z-10 mx-auto px-4 lg:px-12">
          <div className="max-w-4xl">
            <Badge variant="luxury" className="mb-4 border border-white/20 bg-white/15 text-white shadow-xl backdrop-blur-md">
              Destination Guide
            </Badge>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.55)] md:text-6xl">
              {destination.title}
            </h1>
            <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-white md:text-lg md:leading-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
              {blog?.seo?.description || destination.intro}
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pt-10 lg:px-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <main className="lg:col-span-8">
            <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-10">
              <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-2 text-primary">
                  <IoLocationOutline className="text-lg" />
                  <span className="text-[11px] font-black uppercase tracking-[0.25em]">
                    {destination.title}
                  </span>
                </div>
                {blog?.category && <Badge variant="primary">{blog.category}</Badge>}
              </div>

              <div className="prose prose-sm max-w-none text-gray-700 md:prose-lg">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h4: ({ node, ...props }) => (
                      <h4
                        className="mb-5 mt-10 border-l-4 border-primary pl-4 text-2xl font-black uppercase tracking-tight text-gray-900"
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="mb-6 text-[15px] font-medium leading-8 text-gray-700" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="mb-2 ml-4 list-disc font-medium text-gray-700" {...props} />
                    ),
                    a: ({ node, href, children, ...props }) => (
                      <Link to={buildTenantScopedPath(href, location.pathname)} className="font-black text-primary hover:underline" {...props}>
                        {children}
                      </Link>
                    ),
                  }}
                >
                  {articleContent}
                </ReactMarkdown>
              </div>
            </div>

            <div className="mt-10 rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-10">
              <div className="mb-8">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                  Questions
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-gray-900">
                  {destination.title} FAQs
                </h2>
              </div>

              <div className="space-y-4">
                {destinationFaqs.length > 0 ? (
                  destinationFaqs.map((faq, index) => {
                    const isOpen = openFaqIndex === index;

                    return (
                      <div
                        key={`${faq.question}-${index}`}
                        className="overflow-hidden rounded-3xl border border-gray-100 bg-gray-50"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
                        >
                          <span className="text-sm font-black uppercase tracking-wide text-gray-900 md:text-base">
                            {faq.question}
                          </span>
                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                            <IoChevronDownOutline className="text-xl text-primary" />
                          </motion.div>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="px-5 pb-5 text-sm font-medium leading-7 text-gray-600 md:px-6">
                                {faq.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-6 text-sm font-medium leading-7 text-gray-600 md:px-6">
                    No destination-specific FAQs have been assigned yet. Add FAQs to tours tagged for {destination.title} in the CMS to populate this section.
                  </div>
                )}
              </div>
            </div>
          </main>

          <aside className="space-y-8 lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-gray-900">
                  Tours For {destination.title}
                </h3>
                <div className="space-y-5">
                  {relatedTours.length > 0 ? (
                    relatedTours.slice(0, 3).map((tour) => (
                      <Link
                        key={tour._id}
                        to={buildTenantScopedTourPath(tour, location.pathname)}
                        state={tour}
                        className="group flex gap-4"
                      >
                        <div className="h-20 w-20 overflow-hidden rounded-2xl border border-gray-100">
                          <img
                            src={tour.image}
                            alt={tour.title}
                            className="h-full w-full object-fill transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                            {tour.tourType || "Safari"}
                          </p>
                          <h4 className="mt-2 line-clamp-2 text-sm font-black uppercase tracking-tight text-gray-900 group-hover:text-primary">
                            {tour.title}
                          </h4>
                          <p className="mt-2 text-xs font-bold text-gray-500">
                            From ${tour.price}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm font-medium leading-7 text-gray-600">
                      No tours are assigned to this destination page yet. Add destination-tagged tours in the CMS to show only the correct itineraries here.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                <h3 className="mb-4 text-xl font-black uppercase tracking-tight text-gray-900">
                  Destination Snapshot
                </h3>
                <p className="text-sm font-medium leading-7 text-gray-600">
                  {destination.intro}
                </p>
              </div>
            </div>
          </aside>
        </div>

        {relatedTours.length > 0 && (
          <section className="mt-16">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                  Suggested Tours
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-gray-900">
                  Explore {destination.title}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {relatedTours.slice(0, 3).map((tour) => (
                <PackageCard key={tour._id} {...tour} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="mt-16">
        <Testimonial />
      </div>
      <div className="mt-12">
        <TripCTA />
      </div>
      <LogoSlider />
    </div>
  );
};

export default DestinationDetail;
