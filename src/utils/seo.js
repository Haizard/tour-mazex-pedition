const viteEnv =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
const processEnv =
  typeof process !== "undefined" && process.env ? process.env : {};
const rawSiteUrl =
  viteEnv.VITE_SITE_URL || processEnv.VITE_SITE_URL || processEnv.SITE_URL || "https://mazexpeditions.com";

export const SITE_URL = rawSiteUrl.replace(/\/+$/, "");

export const slugifySeo = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(value);

const toIsoDate = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const stripEmpty = (value) => {
  if (Array.isArray(value)) {
    const next = value
      .map(stripEmpty)
      .filter((item) => item !== undefined && item !== null && item !== "");
    return next.length ? next : undefined;
  }

  if (value && typeof value === "object") {
    const next = Object.entries(value).reduce((acc, [key, item]) => {
      const cleaned = stripEmpty(item);
      if (cleaned !== undefined && cleaned !== null && cleaned !== "") {
        acc[key] = cleaned;
      }
      return acc;
    }, {});

    return Object.keys(next).length ? next : undefined;
  }

  return value;
};

export const resolveCanonicalUrl = (canonicalUrl, fallbackPath = "") => {
  if (canonicalUrl && isAbsoluteUrl(canonicalUrl)) {
    const parsed = new URL(canonicalUrl);
    return new URL(parsed.pathname || "/", SITE_URL).toString();
  }

  if (canonicalUrl) {
    return new URL(
      canonicalUrl.startsWith("/") ? canonicalUrl : `/${canonicalUrl}`,
      SITE_URL,
    ).toString();
  }

  if (fallbackPath) {
    return new URL(
      fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`,
      SITE_URL,
    ).toString();
  }

  if (typeof window !== "undefined") {
    return new URL(window.location.pathname || "/", SITE_URL).toString();
  }

  return SITE_URL;
};

export const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return undefined;
  if (isAbsoluteUrl(imageUrl)) return imageUrl;
  return new URL(imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`, SITE_URL).toString();
};

export const parseJsonLd = (schema) => {
  if (!schema) return [];

  if (Array.isArray(schema)) {
    return schema
      .map(parseJsonLd)
      .flat()
      .filter(Boolean);
  }

  if (typeof schema === "object") {
    const cleaned = stripEmpty(schema);
    return cleaned ? [cleaned] : [];
  }

  if (typeof schema === "string") {
    try {
      const parsed = JSON.parse(schema);
      return parseJsonLd(parsed);
    } catch (error) {
      console.warn("Invalid JSON-LD schema ignored:", error);
    }
  }

  return [];
};

export const buildBreadcrumbSchema = (items = []) => {
  const listItems = items
    .filter((item) => item?.name && item?.path)
    .map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: resolveCanonicalUrl("", item.path),
    }));

  if (!listItems.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: listItems,
  };
};

export const buildFaqSchema = (faqs = []) => {
  const mainEntity = faqs
    .filter((faq) => faq?.question && faq?.answer)
    .map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    }));

  if (!mainEntity.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
};

export const buildWebPageSchema = ({
  title,
  description,
  path,
  image,
  type = "WebPage",
} = {}) =>
  stripEmpty({
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url: resolveCanonicalUrl(path),
    image: resolveImageUrl(image),
    isPartOf: SITE_URL,
  });

export const buildBlogPostingSchema = (blog, path) => {
  if (!blog) return null;

  const publishedAt = blog.createdAt || blog.date;
  const modifiedAt = blog.updatedAt || blog.createdAt || blog.date;

  return stripEmpty({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.seo?.title || blog.title,
    description: blog.seo?.description || blog.content?.slice(0, 180),
    image: resolveImageUrl(blog.seo?.ogImage || blog.image),
    url: resolveCanonicalUrl(blog.seo?.canonicalUrl, path),
    datePublished: toIsoDate(publishedAt),
    dateModified: toIsoDate(modifiedAt),
    author: blog.author
      ? {
          "@type": "Person",
          name: blog.author,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "MAZ Expeditions",
      url: SITE_URL,
    },
    articleSection: blog.category,
    keywords: blog.seo?.keywords?.join(", "),
    mainEntityOfPage: resolveCanonicalUrl(blog.seo?.canonicalUrl, path),
  });
};

export const buildTourSchema = (tour, path) => {
  if (!tour) return null;

  return stripEmpty({
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.seo?.title || tour.title,
    description: tour.seo?.description || tour.description,
    image: resolveImageUrl(tour.seo?.ogImage || tour.image),
    url: resolveCanonicalUrl(tour.seo?.canonicalUrl, path),
    itinerary: (tour.itinerary || []).map((item) => ({
      "@type": "TouristAttraction",
      name: `Day ${item.day}`,
      description: (item.events || []).join(", "),
    })),
    touristType: [tour.tourType, tour.category].filter(Boolean),
    offers: tour.price
      ? {
          "@type": "Offer",
          price: Number(tour.price),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: resolveCanonicalUrl(tour.seo?.canonicalUrl, path),
        }
      : undefined,
    provider: {
      "@type": "TravelAgency",
      name: "MAZ Expeditions",
      url: SITE_URL,
    },
    departureLocation: tour.startLocation
      ? {
          "@type": "Place",
          name: tour.startLocation,
        }
      : undefined,
    arrivalLocation: tour.endLocation
      ? {
          "@type": "Place",
          name: tour.endLocation,
        }
      : undefined,
  });
};

export const buildDestinationSchema = (destination, path, description, image) => {
  if (!destination) return null;

  return stripEmpty({
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: destination.title,
    description: description || destination.intro,
    url: resolveCanonicalUrl("", path),
    image: resolveImageUrl(image || destination.image),
    keywords: destination.aliases?.join(", "),
    touristType: "Safari travelers",
  });
};
