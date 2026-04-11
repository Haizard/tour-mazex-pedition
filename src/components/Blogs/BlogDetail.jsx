import React, { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FaFacebookF,
  FaXTwitter,
  FaWhatsapp,
  FaLinkedinIn,
  FaRegBookmark,
  FaRegShareFromSquare
} from "react-icons/fa6";
import { fetchBlogBySlug, fetchBlogs, fetchTours } from "../../services/api";
import PackageCard from "./PackageCard";
import Testimonial from "../Testimonial/Testimonial";
import TripCTA from "../Home/TripCTA";
import LogoSlider from "../Home/LogoSlider";
import SEO from "../UI/SEO";
import {
  buildBlogPostingSchema,
  buildBreadcrumbSchema,
  resolveCanonicalUrl,
  slugifySeo,
} from "../../utils/seo";

const BlogDetail = () => {
  const { title: blogSlug } = useParams();
  const location = useLocation();
  const [blog, setBlog] = useState(location.state || null);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [featuredTours, setFeaturedTours] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { image, date, title, content, author, category } = blog || {};
  const sectionHeadings = [...(content?.matchAll(/^####\s+(.+)$/gm) || [])].map(
    (match, index) => ({
      id: `section-${index + 1}`,
      label: match[1].replace(/[*_`#]/g, "").trim(),
    })
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    const initPage = async () => {
      const currentBlog = await loadBlog();
      if (currentBlog) {
        loadSidebarData(currentBlog);
      }
    };
    initPage();
  }, [blogSlug]);

  const loadBlog = async () => {
    try {
      setIsLoading(true);
      const response = await fetchBlogBySlug(blogSlug);
      setBlog(response.data);
      return response.data;
    } catch (error) {
      console.error("Blog load fail:", error);
      setBlog(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSidebarData = async (currentBlog) => {
    try {
      const blogsRes = await fetchBlogs();
      const toursRes = await fetchTours();

      setLatestBlogs(blogsRes.data.slice(0, 5));
      
      // Smart filter for featured tours based on blog context
      const blogCat = (currentBlog?.category || "").toLowerCase();
      const blogTitle = (currentBlog?.title || "").toLowerCase();
      const blogContent = (currentBlog?.content || "").toLowerCase();
      const blogFullContext = `${blogCat} ${blogTitle} ${blogContent}`;
      
      const isTrekking = /trek|trekking|kilimanjaro|climb|summit|route|hike|mountain/.test(blogFullContext);
      const isSafari = /safari|serengeti|ngorongoro|tarangire|wildlife|migration|game drive/.test(blogFullContext);
      
      const filteredTours = toursRes.data.filter((tour) => {
        const tourType = (tour.tourType || "").toLowerCase();
        const tourCat = (tour.category || "").toLowerCase();
        const tourTitle = (tour.title || "").toLowerCase();
        const tourLocation = (tour.location || "").toLowerCase();
        const tourFullContext = `${tourType} ${tourCat} ${tourTitle} ${tourLocation}`;

        // STRICT: If trek blog, ONLY show trek tours
        if (isTrekking) {
          return /trek|trekking|kilimanjaro|climb|mountain/.test(tourFullContext);
        }
        
        // STRICT: If safari blog, ONLY show safari tours
        if (isSafari) {
          return /safari|serengeti|wildlife|national park|game drive/.test(tourFullContext) && 
                 !/kilimanjaro|mountain|trekking/.test(tourFullContext); // Extra safeguard
        }
        
        // Fallback or other
        return false;
      });
      
      setFeaturedTours(filteredTours.slice(0, 3));

      const counts = {};
      blogsRes.data.forEach((b) => {
        counts[b.category] = (counts[b.category] || 0) + 1;
      });
      setCategories(Object.entries(counts));
    } catch (error) {
      console.error("Sidebar data load fail:", error);
    }
  };

  if (isLoading && !blog)
    return <div className="text-center py-20">Loading blog...</div>;

  if (!blog)
    return <div className="text-center py-20">No blog data found</div>;

  const canonicalPath = `/blogs/${slugifySeo(blog.title)}`;
  const canonicalUrl = resolveCanonicalUrl(blog.seo?.canonicalUrl, canonicalPath);
  const pageSchema = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blogs", path: "/blogs" },
      { name: blog.title, path: canonicalPath },
    ]),
    buildBlogPostingSchema(blog, canonicalPath),
  ];

  let headingIndex = -1;

  return (
    <div className="pb-20 pt-24 bg-gray-50/30 min-h-screen">
      <SEO 
        title={blog.seo?.title || blog.title}
        description={blog.seo?.description || (blog.content?.substring(0, 160))}
        keywords={blog.seo?.keywords}
        ogImage={blog.seo?.ogImage || blog.image}
        canonicalUrl={canonicalUrl}
        schema={[...pageSchema, blog.seo?.schema]}
        type="article"
      />
      <div
        className="relative flex min-h-[340px] items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat md:min-h-[440px]"
        style={{ backgroundImage: `url('${image}')` }}
      >
        <div className="absolute inset-0 bg-black/45" />
        <div className="container relative z-10 mx-auto px-4 lg:px-12">
          <div className="text-center max-w-4xl mx-auto">
            <span className="bg-white/15 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block backdrop-blur-sm border border-white/20">
              {category}
            </span>
            <h1 className="text-xl md:text-5xl font-black text-white uppercase tracking-tight md:tracking-tighter mb-4 leading-[0.95]">
              {title}
            </h1>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-white/80 font-bold uppercase text-[9px] tracking-widest">
              <div className="flex items-center gap-2">
                <span className="bg-white/15 px-2 py-1 rounded-full text-white border border-white/20">
                  {author?.[0] || "A"}
                </span>
                <span>By {author}</span>
              </div>
              <span className="hidden md:block w-1.5 h-1.5 bg-white/40 rounded-full"></span>
              <span>{new Date(date).toLocaleDateString(undefined, { dateStyle: "long" })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-0 md:px-4 lg:px-12 pt-8 md:pt-12">
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-4">
          <div className="bg-white p-3 rounded-full shadow-2xl border border-gray-100 flex flex-col gap-6">
            <ShareButton icon={<FaFacebookF />} url={`https://www.facebook.com/sharer/sharer.php?u=${canonicalUrl}`} color="hover:text-[#1877F2]" />
            <ShareButton icon={<FaXTwitter />} url={`https://twitter.com/intent/tweet?url=${canonicalUrl}&text=${title}`} color="hover:text-[#000000]" />
            <ShareButton icon={<FaWhatsapp />} url={`https://wa.me/?text=${title}%20${canonicalUrl}`} color="hover:text-[#25D366]" />
            <ShareButton icon={<FaLinkedinIn />} url={`https://www.linkedin.com/sharing/share-offsite/?url=${canonicalUrl}`} color="hover:text-[#0A66C2]" />
          </div>
          <button className="bg-white p-4 rounded-full shadow-xl border border-gray-100 text-gray-400 hover:text-primary transition-colors">
            <FaRegBookmark className="text-xl" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-none md:rounded-[40px] overflow-hidden shadow-none md:shadow-2xl mb-8 md:mb-12 border-y md:border border-gray-100">
              <div className="p-4 md:p-12">
                <div className="prose prose-sm md:prose-lg max-w-none text-gray-700 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h4: ({ node, ...props }) => {
                        headingIndex += 1;
                        const headingId =
                          sectionHeadings[headingIndex]?.id || `section-${headingIndex + 1}`;

                        return (
                          <h4
                            id={headingId}
                            className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight mt-6 md:mt-10 mb-4 md:mb-6 border-l-[3px] md:border-l-4 border-primary pl-3 md:pl-4 scroll-mt-32"
                            {...props}
                          />
                        );
                      },
                      img: ({ node, ...props }) => (
                        <img
                          className="mx-auto my-6 md:my-10 max-h-[420px] w-full max-w-2xl rounded-xl md:rounded-[24px] object-fill shadow-lg"
                          loading="lazy"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="mb-4 md:mb-8 leading-relaxed md:leading-8 text-[13px] md:text-lg font-medium"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="font-black text-gray-900"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          className="mb-3 list-disc list-outside ml-4 font-medium"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="mb-8 space-y-2" {...props} />
                      ),
                      em: ({ node, ...props }) => (
                        <em
                          className="text-primary font-bold not-italic decoration-primary/20 underline underline-offset-4"
                          {...props}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <Link
                          to={props.href}
                          className="text-primary font-black hover:underline decoration-2"
                          {...props}
                        >
                          {props.children}
                        </Link>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
                <div className="mt-16 pt-12 border-t border-gray-100">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                      <FaRegShareFromSquare className="text-primary text-xl" />
                      <span className="text-sm font-black uppercase tracking-widest text-gray-900">Share this story</span>
                    </div>
                    <div className="flex gap-4">
                      <SocialIcon icon={<FaFacebookF />} url={`https://www.facebook.com/sharer/sharer.php?u=${canonicalUrl}`} label="Facebook" />
                      <SocialIcon icon={<FaXTwitter />} url={`https://twitter.com/intent/tweet?url=${canonicalUrl}&text=${title}`} label="X (Twitter)" />
                      <SocialIcon icon={<FaWhatsapp />} url={`https://wa.me/?text=${title}%20${canonicalUrl}`} label="WhatsApp" />
                      <SocialIcon icon={<FaLinkedinIn />} url={`https://www.linkedin.com/sharing/share-offsite/?url=${canonicalUrl}`} label="LinkedIn" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6 md:space-y-10 sticky top-32 self-start h-fit px-4 md:px-0">
            {sectionHeadings.length > 0 && (
              <div className="bg-white p-5 md:p-8 rounded-3xl md:rounded-[32px] border border-gray-100 shadow-sm">
                <h3 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight mb-4 md:mb-6 border-b pb-3 md:pb-4">
                  On This Page
                </h3>
                <div className="space-y-3">
                  {sectionHeadings.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-xs md:text-sm font-bold text-gray-500 hover:text-primary transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-5 md:p-8 rounded-3xl md:rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight mb-4 md:mb-6 border-b pb-3 md:pb-4">
                Categories
              </h3>
              <div className="space-y-4">
                {categories.map(([cat, count]) => (
                  <Link
                    key={cat}
                    to="/blogs"
                    className="flex justify-between items-center group"
                  >
                    <span className="text-sm md:text-base font-bold text-gray-500 group-hover:text-primary transition-colors">
                      {cat}
                    </span>
                    <span className="bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-black transition-all">
                      {count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 md:p-8 rounded-3xl md:rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight mb-4 md:mb-6 border-b pb-3 md:pb-4">
                Read Next
              </h3>
              <div className="space-y-4 md:space-y-6">
                {latestBlogs
                  .filter((b) => b.title !== title)
                  .map((b) => (
                    <Link
                      key={b._id}
                      to={`/blogs/${slugify(b.title)}`}
                      state={b}
                      className="flex gap-4 group"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                        <img
                          src={b.image}
                          className="w-full h-full object-fill group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="font-black text-xs md:text-sm text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 uppercase">
                          {b.title}
                        </h4>
                        <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase mt-1 md:mt-2 block">
                          {b.category}
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-12 md:mt-24 border-t pt-8 md:pt-16 mb-8 md:mb-0 px-4 md:px-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-0 mb-6 md:mb-12">
            <div>
              <span className="text-primary font-black uppercase text-[10px] md:text-xs tracking-widest mb-1 md:mb-2 block">
                Take Action
              </span>
              <h2 className="text-2xl md:text-5xl font-black text-gray-900 uppercase tracking-tight md:tracking-tighter">
                Ready for an Adventure?
              </h2>
            </div>
            <Link
              to="/packages"
              className="mb-1 md:mb-2 text-gray-400 font-bold hover:text-primary uppercase text-[10px] md:text-xs tracking-widest"
            >
              View All Packages
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8">
            {featuredTours.map((tour) => (
              <PackageCard key={tour._id} {...tour} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <Testimonial />
      </div>

      <div className="mt-12 md:mt-16">
        <TripCTA />
      </div>

      <LogoSlider />
    </div>
  );
};

const ShareButton = ({ icon, url, color }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className={`text-gray-400 text-lg transition-all duration-300 hover:scale-125 ${color}`}
  >
    {icon}
  </a>
);

const SocialIcon = ({ icon, url, label }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    title={label}
    className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-lg active:scale-95"
  >
    {icon}
  </a>
);

export default BlogDetail;
