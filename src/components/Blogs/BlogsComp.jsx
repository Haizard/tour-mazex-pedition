import React from "react";
import BlogCard from "./BlogCard";
import { Link } from "react-router-dom";
import { fetchBlogs } from "../../services/api";
import { FaSearch } from "react-icons/fa";

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
  const [searchInput, setSearchInput] = React.useState("");

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

  const visibleBlogs = React.useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return blogsData;

    return blogsData.filter((blog) =>
      `${blog.title || ""} ${blog.category || ""} ${blog.content || ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [blogsData, searchInput]);

  const blogGroups = getBlogGroups(visibleBlogs);

  return (
    <div className="bg-white py-20 pb-24">
      <section className="container px-4 max-w-7xl mx-auto">
        {blogsData.length > 0 ? (
          <div className="space-y-16">
            <div className="mx-auto max-w-3xl rounded-[28px] border border-gray-100 bg-white p-4 shadow-sm md:p-5">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <FaSearch className="text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search blogs, destinations, parks, or travel topics..."
                  className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

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
                    to={`/blogs/category/${group.key}`}
                    className="rounded-md bg-[#2a5d24] px-6 py-3 text-sm font-bold text-white transition-colors duration-300 hover:bg-[#1f471b]"
                  >
                    {group.cta}
                  </Link>
                </div>
              </section>
              );
            })}

            {visibleBlogs.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
                <p className="text-lg font-black uppercase tracking-tight text-gray-900">
                  No stories match that search
                </p>
                <p className="mt-3 text-sm font-medium text-gray-500">
                  Try a destination name, travel style, or wildlife topic.
                </p>
              </div>
            )}
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
