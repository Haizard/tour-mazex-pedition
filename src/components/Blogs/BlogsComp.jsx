import React from "react";
import BlogCard from "./BlogCard";
import { Link } from "react-router-dom";
import { fetchBlogs } from "../../services/api";
import { FaSearch } from "react-icons/fa";

const slugifyTitle = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const getBlogGroups = (blogs, labels) => {
  const safari = [];
  const trekking = [];
  const other = [];

  blogs.forEach((blog) => {
    const searchable = `${blog.category || ""} ${blog.title || ""} ${blog.content || ""}`.toLowerCase();

    if (/trek|trekking|kilimanjaro|climb|summit|route|hike|mountain/.test(searchable)) {
      trekking.push(blog);
      return;
    }

    if (/safari|serengeti|ngorongoro|tarangire|wildlife|migration|zanzibar|beach|game drive/.test(searchable)) {
      safari.push(blog);
      return;
    }

    other.push(blog);
  });

  return [
    {
      key: "safari",
      title: labels?.safariTitle || "Safari",
      accent: labels?.safariAccent || "Articles",
      cta: labels?.safariCta || "View More Safari Articles",
      blogs: safari,
    },
    {
      key: "trekking",
      title: labels?.trekkingTitle || "Trekking",
      accent: labels?.trekkingAccent || "Articles",
      cta: labels?.trekkingCta || "View More Trekking Articles",
      blogs: trekking,
    },
    {
      key: "other",
      title: labels?.travelTitle || "Travel",
      accent: labels?.travelAccent || "Articles",
      cta: labels?.travelCta || "View More Travel Articles",
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

const BlogsComp = ({
  variant = "category-grid",
  maxPerCategory = null,
  searchPlaceholder = "Search blogs, destinations, parks, or travel topics...",
  emptyTitle = "No stories match that search",
  emptyDescription = "Try a destination name, travel style, or wildlife topic.",
  sectionEyebrow = "",
  sectionTitle = "",
  sectionDescription = "",
  groupLabels = {},
}) => {
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
        .includes(query)
    );
  }, [blogsData, searchInput]);

  const blogGroups = getBlogGroups(visibleBlogs, groupLabels);

  return (
    <div className="bg-white py-20 pb-24">
      <section className="container px-4 max-w-7xl mx-auto">
        {blogsData.length > 0 ? (
          <div className="space-y-16">
            {variant === "editorial-list" ? (
              <div className="mx-auto max-w-4xl text-center">
                {sectionEyebrow ? (
                  <p className="mb-3 font-oswald text-xs uppercase tracking-[0.3em] text-safari-green">
                    {sectionEyebrow}
                  </p>
                ) : null}
                {sectionTitle ? (
                  <h2 className="font-heading text-4xl leading-tight text-slate-900 md:text-6xl">
                    {sectionTitle}
                  </h2>
                ) : null}
                {sectionDescription ? (
                  <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                    {sectionDescription}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mx-auto max-w-3xl rounded-[28px] border border-gray-100 bg-white p-4 shadow-sm md:p-5">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <FaSearch className="text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            {blogGroups.map((group) => {
              const limitedBlogs =
                typeof maxPerCategory === "number" && maxPerCategory > 0
                  ? group.blogs.slice(0, maxPerCategory)
                  : group.blogs;

              return (
                <section key={group.key} className="py-2">
                  <SectionHeading title={group.title} accent={group.accent} />
                  {variant === "editorial-list" ? (
                    <div className="space-y-4">
                      {limitedBlogs.map((item) => (
                        <Link
                          key={item._id}
                          to={`/blogs/${slugifyTitle(item.title)}`}
                          state={item}
                          className="grid gap-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-safari-green/40 hover:shadow-xl md:grid-cols-[260px_minmax(0,1fr)] md:p-5"
                        >
                          <div className="h-56 overflow-hidden rounded-[22px]">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                          </div>
                          <div className="flex flex-col justify-between gap-4 text-left">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-safari-green">
                                {item.category || group.title}
                              </p>
                              <h3 className="mt-3 font-heading text-2xl leading-tight text-slate-900">
                                {item.title}
                              </h3>
                              <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-600">
                                {item.excerpt || item.description || item.content || ""}
                              </p>
                            </div>
                            <div className="inline-flex items-center gap-3 font-oswald text-sm uppercase tracking-[0.18em] text-slate-900">
                              Read article
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8 px-1 md:px-0">
                      {limitedBlogs.map((item) => (
                        <BlogCard key={item._id} {...item} />
                      ))}
                    </div>
                  )}

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
                  {emptyTitle}
                </p>
                <p className="mt-3 text-sm font-medium text-gray-500">
                  {emptyDescription}
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
