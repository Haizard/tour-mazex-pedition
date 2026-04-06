import React from "react";
import { Link } from "react-router-dom";
import { FaCalendarAlt, FaEye } from "react-icons/fa";

const BlogCard = ({
  image,
  date,
  title,
  content,
  author,
  category,
  views,
}) => {
  const slug = title
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <article className="group h-full">
      <Link
        to={`/blogs/${slug}`}
        onClick={() => window.scrollTo(0, 0)}
        state={{ image, date, title, content, author, category, views }}
        className="flex flex-col h-full bg-white rounded-xl md:rounded-[20px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-safari-green transition-all duration-300 hover:-translate-y-1 relative"
      >
        {/* Image Container */}
        <div className="relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors z-10" />
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-[150px] md:h-[200px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Internal Category Badge */}
          {category && (
            <div className="absolute top-2 left-2 z-20 bg-white/95 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full shadow-sm">
              <span className="text-[9px] md:text-[10px] font-oswald font-bold tracking-widest text-safari-green uppercase">
                {category}
              </span>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex flex-col flex-1 p-3 md:p-5 relative bg-white">
          <div className="mb-1 md:mb-2 flex items-center gap-1.5 text-[10px] md:text-xs font-medium text-gray-500">
            <FaCalendarAlt className="text-safari-green" />
            <span>{formattedDate}</span>
          </div>

          <h2 className="mb-2 md:mb-3 line-clamp-2 text-sm md:text-lg font-heading font-bold leading-tight text-gray-900 transition-colors duration-300 group-hover:text-[#6e3710]">
            {title}
          </h2>

          <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
            <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-[#8B4513] transition-all duration-300 group-hover:text-[#6e3710] flex items-center gap-1">
              Read Story 
              <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] md:text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
              <FaEye />
              {views}
            </span>
          </div>
        </div>
      </Link>

      {content ? (
        <div className="sr-only">
          <p>{content}</p>
        </div>
      ) : null}
    </article>
  );
};

export default BlogCard;
