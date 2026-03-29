import React from "react";
import { useLocation } from "react-router-dom";
import BlogsComp from "../components/Blogs/BlogsComp";

const BlogsDetails = (props) => {
  const location = useLocation();
  const { image, date, title, description, author } = location.state;

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8">
      {/* Blog Image */}
      <div className="h-[300px] overflow-hidden mb-6">
        <img
          src={image}
          alt={title}
          className="mx-auto h-full w-full object-cover transition duration-700 hover:scale-110"
        />
      </div>

      {/* Blog Details */}
      <div className="container mx-auto">
        <p className="text-slate-600 text-sm py-3">
          Written by {author} on {date}
        </p>
        <h1 className="text-2xl font-semibold mb-4">{title}</h1>
        <p className="text-base leading-relaxed">{description}</p>
      </div>

      {/* All Blogs Section */}
      <div className="mt-10">
        <BlogsComp />
      </div>
    </div>
  );
};

export default BlogsDetails;
