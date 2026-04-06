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
        className="block h-full overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1"
      >
        <div className="overflow-hidden">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-[140px] md:h-[250px] w-full object-fill transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        <div className="flex min-h-[130px] md:min-h-[160px] flex-col px-1 pt-3 md:pt-4">
          <div className="mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2 text-[11px] md:text-[13px] font-medium text-[#7b776e]">
            <FaCalendarAlt className="text-[10px] md:text-[12px] text-[#6d4a1f]" />
            <span>{formattedDate}</span>
          </div>

          <h2 className="mb-3 md:mb-4 line-clamp-3 text-[14px] md:text-[20px] font-semibold uppercase leading-snug text-[#2a2a2a] transition-colors duration-300 group-hover:text-[#8d5a1a]">
            {title}
          </h2>

          <div className="mt-auto flex items-center justify-between gap-2 md:gap-4 pt-1 md:pt-2">
            <span className="text-[11px] md:text-[13px] font-semibold text-[#6d4a1f] transition-colors duration-300 group-hover:text-[#8d5a1a]">
              Read More
            </span>
            <span className="inline-flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm font-medium text-[#6c675d]">
              <FaEye className="text-[#6d4a1f]" />
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
