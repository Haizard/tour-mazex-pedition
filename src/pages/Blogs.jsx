import React from "react";
import BlogsComp from "../components/Blogs/BlogsComp";
import Testimonial from "../components/Testimonial/Testimonial";
import TripCTA from "../components/Home/TripCTA";
import LogoSlider from "../components/Home/LogoSlider";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

const Blogs = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden bg-[#1a1a1a]">
        <div
          className="relative flex min-h-[320px] items-center justify-center bg-cover bg-center bg-no-repeat sm:min-h-[360px] md:min-h-[400px]"
          style={{ backgroundImage: "url('/assets/images/serval5.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/45" />
          <div className="container relative z-10 px-4 text-center">
            <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl md:text-[56px] md:leading-tight">
              MAZ Expeditions Blog
            </h1>
          </div>
        </div>
      </div>
      <section className="container max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar - Category Filter */}
          <aside className="lg:w-1/4">
            <div className="sticky top-28 space-y-8">
              <div>
                <h3 className="text-xl font-heading font-bold text-gray-900 mb-6 pb-2 border-b-2 border-safari-green inline-block">
                  Categories
                </h3>
                <nav className="flex flex-col gap-2">
                  {[
                    { id: "safari", label: "Safari Articles", count: "12" },
                    { id: "trekking", label: "Trekking Articles", count: "8" },
                    { id: "other", label: "Travel Insights", count: "5" },
                  ].map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/blogs/category/${cat.id}`}
                      className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-safari-green transition-all duration-300"
                    >
                      <span className="font-heading font-medium text-gray-700 group-hover:text-white transition-colors">
                        {cat.label}
                      </span>
                      <FaChevronRight className="text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-all" size={12} />
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Quick Trip CTA in Sidebar */}
              <div className="bg-[#6f5336] p-8 rounded-3xl text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <h4 className="text-2xl font-heading font-bold mb-4">Start your Journey</h4>
                  <p className="text-white/70 text-sm mb-6 leading-relaxed">
                    Custom itineraries inspired by 10+ years of expertise.
                  </p>
                  <Link to="/contact" className="inline-block bg-safari-green px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-green-800 transition-colors">
                    Plan Now
                  </Link>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700 text-[120px]">
                  🌍
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:w-3/4">
            <BlogsComp maxPerCategory={3} />
          </main>
        </div>
      </section>

      <div className="mt-8">
        <Testimonial />
      </div>

      <div className="mt-8">
        <TripCTA />
      </div>

      <LogoSlider />
    </div>
  );
};

export default Blogs;
