import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchBlogs, fetchTours } from "../services/api";
import BlogCard from "../components/Blogs/BlogCard";
import PackageCard from "../components/Blogs/PackageCard";
import Testimonial from "../components/Testimonial/Testimonial";
import TripCTA from "../components/Home/TripCTA";
import { motion, AnimatePresence } from "framer-motion";
import LogoSlider from "../components/Home/LogoSlider";

const BlogCategory = () => {
  const { categoryId } = useParams();
  const [blogs, setBlogs] = useState([]);
  const [matchingTours, setMatchingTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        const [blogsRes, toursRes] = await Promise.all([
          fetchBlogs(),
          fetchTours()
        ]);
        
        // Filter blogs
        const filteredBlogs = blogsRes.data.filter((blog) => {
          const searchable = `${blog.category || ""} ${blog.title || ""} ${blog.content || ""}`.toLowerCase();
          if (categoryId === "trekking") return /trek|trekking|kilimanjaro|climb|summit|route|hike|mountain/.test(searchable);
          if (categoryId === "safari") return /safari|serengeti|ngorongoro|tarangire|wildlife|migration|zanzibar|beach|game drive/.test(searchable);
          if (categoryId === "other") {
            const isTrekking = /trek|trekking|kilimanjaro|climb|summit|route|hike|mountain/.test(searchable);
            const isSafari = /safari|serengeti|ngorongoro|tarangire|wildlife|migration|zanzibar|beach|game drive/.test(searchable);
            return !isTrekking && !isSafari;
          }
          return (blog.category || "").toLowerCase() === categoryId.toLowerCase();
        });
        setBlogs(filteredBlogs);

        // Filter tours
        const filteredTours = toursRes.data.filter((tour) => {
          const searchable = `${tour.category || ""} ${tour.tourType || ""} ${tour.title || ""} ${tour.location || ""}`.toLowerCase();
          if (categoryId === "trekking") return /trek|trekking|kilimanjaro|climb|mountain/.test(searchable);
          if (categoryId === "safari") return /safari|serengeti|wildlife|national park|game drive/.test(searchable);
          return false;
        });
        setMatchingTours(filteredTours.slice(0, 3));

      } catch (error) {
        console.error("Error fetching category data:", error);
      } finally {
        setLoading(false);
      }
    };
    getData();
    window.scrollTo(0, 0);
  }, [categoryId]);

  // Map category ID to display names and hero images
  const categoryMeta = {
    safari: {
      title: "Safari Articles",
      image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    },
    trekking: {
      title: "Trekking Articles",
      image: "https://images.unsplash.com/photo-1520209268518-aec60b8bb5cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    },
    other: {
      title: "Travel Insights",
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    },
  };

  const currentMeta = (categoryId && categoryMeta[categoryId.toLowerCase()]) || {
    title: `${(categoryId || "Category").charAt(0).toUpperCase() + (categoryId || "Category").slice(1)} Articles`,
    image: "https://images.unsplash.com/photo-1533130061792-64b345e4a833?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic Hero Section */}
      <div className="relative overflow-hidden bg-[#1a1a1a]">
        <div
          className="relative flex min-h-[350px] md:min-h-[450px] items-center justify-center bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{ backgroundImage: `url('${currentMeta.image}')` }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="container relative z-10 px-4 text-center">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
             >
                <span className="text-safari-gold font-oswald uppercase tracking-[0.3em] text-xs md:text-sm mb-4 block">
                  Archive
                </span>
                <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl md:text-[64px] md:leading-tight uppercase tracking-tighter">
                  {currentMeta.title}
                </h1>
                <div className="h-1.5 w-24 bg-safari-green mx-auto mt-6 rounded-full" />
             </motion.div>
          </div>
        </div>
      </div>

      <div className="container px-4 max-w-7xl mx-auto py-16 pb-20">
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 border-l-4 border-safari-green pl-4">
             Archive <span className="text-safari-gold font-normal">Articles</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-safari-green"></div>
          </div>
        ) : blogs.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8">
            {blogs.map((item) => (
              <BlogCard key={item._id} {...item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-xl font-heading text-gray-400">No articles found in this category yet.</h3>
            <Link to="/blogs" className="text-safari-green mt-4 inline-block underline font-bold">Back to all blogs</Link>
          </div>
        )}
      </div>

      {/* Matching Tour Packages Section */}
      {!loading && matchingTours.length > 0 && (
        <section className="bg-gray-50 py-16 md:py-24">
          <div className="container px-4 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <span className="text-safari-gold font-oswald uppercase tracking-widest text-sm mb-2 block">Premium Experiences</span>
                <h2 className="text-3xl md:text-5xl font-heading font-black text-gray-900 uppercase tracking-tighter leading-none">
                  Top Recommended <br />
                  <span className="text-safari-green">{categoryId === "trekking" ? "Mountain Treks" : "Wildlife Safaris"}</span>
                </h2>
              </div>
              <Link 
                to="/packages" 
                className="bg-white px-6 py-3 rounded-full border border-gray-200 font-bold uppercase text-[10px] tracking-widest hover:border-safari-green hover:text-safari-green transition-all shadow-sm"
              >
                View All Packages
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {matchingTours.map((tour) => (
                <PackageCard key={tour._id} {...tour} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer Content */}
      <Testimonial />
      <div className="mt-4">
        <TripCTA />
      </div>
      <LogoSlider />
    </div>
  );
};

export default BlogCategory;
