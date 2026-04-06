import React from "react";
import BlogCard from "./BlogCard";
import { Link } from "react-router-dom";
import { fetchBlogs } from "../../services/api";

const getBlogGroups = (blogs) => {
  const safari = [];
  const trekking = [];
  const other = [];

  blogs.forEach((blog) => {
    const searchable = `${blog.category || ""} ${blog.title || ""} ${blog.content || ""}`.toLowerCase();

    if (
      /trek|trekking|kilimanjaro|climb|summit|route|hike|mountain/.test(
        searchable
      )
    ) {
      trekking.push(blog);
      return;
    }

    if (
      /safari|serengeti|ngorongoro|tarangire|wildlife|migration|zanzibar|beach|game drive/.test(
        searchable
      )
    ) {
      safari.push(blog);
      return;
    }

    other.push(blog);
  });

  return [
    {
      key: "safari",
      title: "Safari",
      accent: "Articles",
      cta: "View More Safari Articles",
      blogs: safari,
    },
    {
      key: "trekking",
      title: "Trekking",
      accent: "Articles",
      cta: "View More Trekking Articles",
      blogs: trekking,
    },
    {
      key: "other",
      title: "Travel",
      accent: "Articles",
      cta: "View More Travel Articles",
      blogs: other,
    },
  ].filter((group) => group.blogs.length > 0);
};

const SectionHeading = ({ title, accent }) => (
  <div className="mb-8 text-center">
    <h2 className="font-heading text-[34px] font-semibold leading-tight text-[#1d1d1b] md:text-[40px]">
      {title} <span className="text-[#5c3602]">{accent}</span>
    </h2>
  </div>
);

const BlogsComp = ({ maxPerCategory = null }) => {
  const [blogsData, setBlogsData] = React.useState([]);

  React.useEffect(() => {
    const getBlogs = async () => {
      try {
        const response = await fetchBlogs();
        setBlogsData(response.data);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      }
    };
    getBlogs();
  }, []);

  const blogGroups = getBlogGroups(blogsData);

  return (
    <div className="bg-white py-20 pb-24">
      <section className="container px-4 max-w-7xl mx-auto">
        {blogsData.length > 0 ? (
          <div className="space-y-16">
            {blogGroups.map((group) => {
              const visibleBlogs =
                typeof maxPerCategory === "number" && maxPerCategory > 0
                  ? group.blogs.slice(0, maxPerCategory)
                  : group.blogs;

              return (
              <section key={group.key} className="py-2">
                <SectionHeading title={group.title} accent={group.accent} />
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8 px-1 md:px-0">
                  {visibleBlogs.map((item) => (
                    <BlogCard key={item._id} {...item} />
                  ))}
                </div>

                <div className="mt-10 flex justify-center">
                  <Link
                    to="/blogs"
                    className="rounded-md bg-[#2a5d24] px-6 py-3 text-sm font-bold text-white transition-colors duration-300 hover:bg-[#1f471b]"
                  >
                    {group.cta}
                  </Link>
                </div>
              </section>
              );
            })}
          </div>
        ) : (
          <p className="py-20 text-center font-sans text-lg text-gray-500">
            Check back soon for unforgettable stories.
          </p>
        )}
      </section>
    </div>
  );
};

export default BlogsComp;
