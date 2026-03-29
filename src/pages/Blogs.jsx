import React from "react";
import BlogsComp from "../components/Blogs/BlogsComp";

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
              Mazex Pedition Blog
            </h1>
          </div>
        </div>
      </div>
      <BlogsComp />
    </div>
  );
};

export default Blogs;
