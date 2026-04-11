import { slugifySeo } from "./seo.js";

export const normalizeContent = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim();

export const matchDestinationBlog = (blogs = [], destination) => {
  if (!destination) return null;

  const exactDestinationName = normalizeContent(destination.title);

  return (
    blogs.find((entry) => entry.destinationSlug === destination.slug) ||
    blogs.find((entry) => {
      const title = normalizeContent(entry.title);
      return (
        title.includes(exactDestinationName) &&
        /guide|destination|travel|park|crater|lake/.test(title)
      );
    }) ||
    null
  );
};

export const matchDestinationTours = (tours = [], destination) => {
  if (!destination) return [];

  const exactDestinationName = normalizeContent(destination.title);

  return tours.filter((tour) => {
    if (tour.destinationSlug === destination.slug) {
      return true;
    }

    const location = normalizeContent(tour.location);
    const title = normalizeContent(tour.title);
    const destinationsVisited = (tour.destinationsVisited || []).map(normalizeContent);

    return (
      location.includes(exactDestinationName) ||
      title.includes(exactDestinationName) ||
      destinationsVisited.includes(exactDestinationName)
    );
  });
};

export const buildDestinationFaqs = (tours = []) =>
  tours
    .flatMap((tour) => tour.faqs || [])
    .filter((faq) => faq?.question?.trim() && faq?.answer?.trim())
    .filter(
      (faq, index, arr) =>
        arr.findIndex(
          (item) =>
            item.question.trim().toLowerCase() === faq.question.trim().toLowerCase(),
        ) === index,
    )
    .slice(0, 8);

export const buildBlogSidebarData = (currentBlog, blogs = [], tours = []) => {
  const blogCat = normalizeContent(currentBlog?.category);
  const blogTitle = normalizeContent(currentBlog?.title);
  const blogContent = normalizeContent(currentBlog?.content);
  const blogFullContext = `${blogCat} ${blogTitle} ${blogContent}`;

  const isTrekking = /trek|trekking|kilimanjaro|climb|summit|route|hike|mountain/.test(blogFullContext);
  const isSafari = /safari|serengeti|ngorongoro|tarangire|wildlife|migration|game drive/.test(blogFullContext);

  const featuredTours = tours.filter((tour) => {
    const tourType = normalizeContent(tour.tourType);
    const tourCat = normalizeContent(tour.category);
    const tourTitle = normalizeContent(tour.title);
    const tourLocation = normalizeContent(tour.location);
    const tourFullContext = `${tourType} ${tourCat} ${tourTitle} ${tourLocation}`;

    if (isTrekking) {
      return /trek|trekking|kilimanjaro|climb|mountain/.test(tourFullContext);
    }

    if (isSafari) {
      return /safari|serengeti|wildlife|national park|game drive/.test(tourFullContext) &&
        !/kilimanjaro|mountain|trekking/.test(tourFullContext);
    }

    return false;
  });

  const counts = {};
  blogs.forEach((blog) => {
    if (blog.category) {
      counts[blog.category] = (counts[blog.category] || 0) + 1;
    }
  });

  return {
    latestBlogs: blogs.slice(0, 5),
    featuredTours: featuredTours.slice(0, 3),
    categories: Object.entries(counts),
  };
};

export const buildPackageRelatedTours = (currentTour, tours = []) =>
  tours.filter((tour) => tour._id !== currentTour?._id).slice(0, 3);

export const buildDynamicRoutes = ({ blogs = [], tours = [], destinations = [] }) => [
  ...blogs.map((blog) => `/blogs/${slugifySeo(blog.title)}`),
  ...tours.map((tour) => `/packages/${slugifySeo(tour.title)}`),
  ...destinations.map((destination) => `/destinations/${destination.slug}`),
];
