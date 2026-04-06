import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchBlogs } from "../services/api";
import BlogCard from "../components/Blogs/BlogCard";
import Testimonial from "../components/Testimonial/Testimonial";
import TripCTA from "../components/Home/TripCTA";
import LogoSlider from "../components/Home/LogoSlider";

const BlogCategory = () => {
  const { categoryId } = useParams();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getBlogs = async () => {
      try {
        const response = await fetchBlogs();
        // Filter blogs based on the category logic from BlogsComp
        const filtered = response.data.filter((blog) => {
          const searchable = `${blog.category || ""} ${blog.title || ""} ${blog.content || ""}`.toLowerCase();
          
          if (categoryId === "trekking") {
            return /trek|trekking|kilimanjaro|climb|summit|route|hike|mountain/.test(searchable);
          }
          if (categoryId === "safari") {
            return /safari|serengeti|ngorongoro|tarangire|wildlife|migration|zanzibar|beach|game drive/.test(searchable);
          }
          if (categoryId === "other") {
            const isTrekking = /trek|trekking|kilimanjaro|climb|summit|route|hike|mountain/.test(searchable);
            const isSafari = /safari|serengeti|ngorongoro|tarangire|wildlife|migration|zanzibar|beach|game drive/.test(searchable);
            return !isTrekking && !isSafari;
          }
          // Default fall-through for any string match
          return (blog.category || "").toLowerCase() === categoryId.toLowerCase();
        });
        setBlogs(filtered);
      } catch (error) {
        console.error("Error fetching category blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    getBlogs();
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

  const currentMeta = categoryMeta[categoryId] || {
    title: `${categoryId.charAt(0).toUpperCase() + categoryId.slice(1)} Articles`,
    image: "https://images.unsplash.com/photo-1533130061792-64b345e4a833?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80", // Standard hero image
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

      <div className="container px-4 max-w-7xl mx-auto py-20 pb-24">
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
