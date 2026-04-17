import React from "react";
import CinematicHeroSection from "../hero/CinematicHeroSection";
import Trending from "../../components/Home/Trending";
import Welcome from "../../components/Home/Welcome";
import PopularTours from "../../components/Home/PopularTours";
import GroupTours from "../../components/Home/GroupTours";
import BlogsComp from "../../components/Blogs/BlogsComp";
import AfricanDestinations from "../../components/Home/AfricanDestinations";
import Testimonial from "../../components/Testimonial/Testimonial";
import TripCtaSection from "../cta/TripCtaSection";
import LogoSlider from "../../components/Home/LogoSlider";

const sectionComponents = {
  hero: CinematicHeroSection,
  trending: Trending,
  about: Welcome,
  featuredPackages: PopularTours,
  groupTours: GroupTours,
  blogPreview: BlogsComp,
  destinations: AfricanDestinations,
  testimonials: Testimonial,
  cta: TripCtaSection,
  logoCloud: LogoSlider,
};

const metadata = {
  hero: {
    key: "hero",
    label: "Hero",
    category: "marketing",
    supportedVariants: ["cinematic"],
    allowMultiple: false,
    presets: [{ value: "cinematic", label: "Cinematic Hero" }],
    editorSchema: [
      { group: "contentConfig", path: "eyebrow", type: "text", placeholder: "Eyebrow text" },
      { group: "contentConfig", path: "headlineScript", type: "text", placeholder: "Script headline" },
      { group: "contentConfig", path: "primaryCtaLabel", type: "text", placeholder: "Primary CTA label" },
      { group: "contentConfig", path: "primaryCtaHref", type: "text", placeholder: "Primary CTA link" },
      { group: "contentConfig", path: "secondaryCtaLabel", type: "text", placeholder: "Secondary CTA label" },
      { group: "contentConfig", path: "secondaryCtaHref", type: "text", placeholder: "Secondary CTA link" },
    ],
  },
  trending: {
    key: "trending",
    label: "Trending",
    category: "social-proof",
    supportedVariants: ["default"],
    allowMultiple: false,
    presets: [{ value: "default", label: "Trending Carousel" }],
    editorSchema: [
      { group: "contentConfig", path: "heading", type: "text", placeholder: "Trending heading", colSpan: 2 },
    ],
  },
  about: {
    key: "about",
    label: "About / Welcome",
    category: "brand-story",
    supportedVariants: ["welcome"],
    allowMultiple: false,
    presets: [{ value: "welcome", label: "Welcome Story" }],
    editorSchema: [
      { group: "contentConfig", path: "introLabel", type: "text", placeholder: "Intro label" },
      { group: "contentConfig", path: "brandName", type: "text", placeholder: "Brand name" },
      { group: "contentConfig", path: "leadHeading", type: "textarea", placeholder: "Lead heading", rows: 3, colSpan: 2 },
      { group: "contentConfig", path: "bodyText", type: "textarea", placeholder: "Body text", rows: 5, colSpan: 2 },
      { group: "contentConfig", path: "closingHeading", type: "textarea", placeholder: "Closing heading", rows: 2, colSpan: 2 },
      {
        group: "contentConfig",
        path: "cards",
        type: "objectList",
        itemLabel: "Card",
        limit: 4,
        fields: [
          { path: "scriptLabel", type: "text", placeholder: "Script label" },
          { path: "title", type: "text", placeholder: "Title" },
          { path: "description", type: "textarea", placeholder: "Description", rows: 3, colSpan: 2 },
        ],
      },
    ],
  },
  featuredPackages: {
    key: "featuredPackages",
    label: "Featured Packages",
    category: "packages",
    supportedVariants: ["popular-grid"],
    allowMultiple: false,
    presets: [{ value: "popular-grid", label: "Popular Grid" }],
    editorSchema: [
      { group: "contentConfig", path: "prefixLabel", type: "text", placeholder: "Prefix label" },
      { group: "contentConfig", path: "scriptLabel", type: "text", placeholder: "Script label" },
      { group: "contentConfig", path: "suffixLabel", type: "text", placeholder: "Suffix label" },
      {
        group: "dataConfig",
        path: "limit",
        type: "number",
        placeholder: "Number of cards",
        min: 1,
        max: 12,
        fallbackValue: 6,
      },
    ],
  },
  groupTours: {
    key: "groupTours",
    label: "Group Tours",
    category: "packages",
    supportedVariants: ["default"],
    allowMultiple: false,
    presets: [{ value: "default", label: "Group Tours List" }],
    editorSchema: [
      { group: "contentConfig", path: "prefixLabel", type: "text", placeholder: "Prefix label" },
      { group: "contentConfig", path: "scriptLabel", type: "text", placeholder: "Script label" },
      { group: "contentConfig", path: "suffixLabel", type: "text", placeholder: "Suffix label" },
      { group: "contentConfig", path: "capacityLabel", type: "text", placeholder: "Capacity label" },
      { group: "contentConfig", path: "bookingLabel", type: "text", placeholder: "Booking label" },
      { group: "contentConfig", path: "itineraryLabel", type: "text", placeholder: "Itinerary label" },
    ],
  },
  blogPreview: {
    key: "blogPreview",
    label: "Blog Preview",
    category: "content",
    supportedVariants: ["category-grid"],
    allowMultiple: false,
    presets: [{ value: "category-grid", label: "Category Grid" }],
    editorSchema: [
      { group: "contentConfig", path: "searchPlaceholder", type: "text", placeholder: "Search placeholder", colSpan: 2 },
      { group: "contentConfig", path: "emptyTitle", type: "text", placeholder: "Empty state title" },
      { group: "contentConfig", path: "emptyDescription", type: "text", placeholder: "Empty state description" },
      { group: "contentConfig", path: "groupLabels.safariTitle", type: "text", placeholder: "Safari group title" },
      { group: "contentConfig", path: "groupLabels.safariCta", type: "text", placeholder: "Safari CTA" },
      { group: "contentConfig", path: "groupLabels.trekkingTitle", type: "text", placeholder: "Trekking group title" },
      { group: "contentConfig", path: "groupLabels.trekkingCta", type: "text", placeholder: "Trekking CTA" },
      { group: "contentConfig", path: "groupLabels.travelTitle", type: "text", placeholder: "Travel group title" },
      { group: "contentConfig", path: "groupLabels.travelCta", type: "text", placeholder: "Travel CTA" },
    ],
  },
  destinations: {
    key: "destinations",
    label: "Destinations",
    category: "content",
    supportedVariants: ["quote-list"],
    allowMultiple: false,
    presets: [{ value: "quote-list", label: "Quote List" }],
    editorSchema: [
      { group: "contentConfig", path: "title", type: "text", placeholder: "Section title" },
      { group: "contentConfig", path: "subtitle", type: "text", placeholder: "Section subtitle" },
      { group: "contentConfig", path: "description", type: "textarea", placeholder: "Section description", rows: 3, colSpan: 2 },
      { group: "contentConfig", path: "quote", type: "textarea", placeholder: "Highlight quote", rows: 3 },
      { group: "contentConfig", path: "quoteAuthor", type: "text", placeholder: "Quote author" },
    ],
  },
  testimonials: {
    key: "testimonials",
    label: "Testimonials",
    category: "social-proof",
    supportedVariants: ["default"],
    allowMultiple: false,
    presets: [{ value: "default", label: "Review Card Slider" }],
    editorSchema: [
      { group: "contentConfig", path: "backgroundImage", type: "text", placeholder: "Background image URL", colSpan: 2 },
      { group: "contentConfig", path: "ratingLabel", type: "text", placeholder: "Rating label" },
      { group: "contentConfig", path: "reviewCountLabel", type: "text", placeholder: "Review count label" },
      { group: "contentConfig", path: "providerLabel", type: "text", placeholder: "Provider label", colSpan: 2 },
      {
        group: "contentConfig",
        path: "testimonials",
        type: "objectList",
        itemLabel: "Testimonial",
        limit: 3,
        fields: [
          { path: "name", type: "text", placeholder: "Name" },
          { path: "date", type: "text", placeholder: "Date" },
          { path: "text", type: "textarea", placeholder: "Text", rows: 3, colSpan: 2 },
        ],
      },
    ],
  },
  cta: {
    key: "cta",
    label: "Call To Action",
    category: "conversion",
    supportedVariants: ["trip-cta"],
    allowMultiple: false,
    presets: [{ value: "trip-cta", label: "Trip CTA Banner" }],
    editorSchema: [
      { group: "contentConfig", path: "heading", type: "text", placeholder: "Heading" },
      { group: "contentConfig", path: "subheading", type: "text", placeholder: "Subheading" },
      { group: "contentConfig", path: "description", type: "textarea", placeholder: "Description", rows: 3, colSpan: 2 },
      { group: "contentConfig", path: "primaryLabel", type: "text", placeholder: "Primary button label" },
      { group: "contentConfig", path: "primaryHref", type: "text", placeholder: "Primary button link" },
      { group: "contentConfig", path: "secondaryLabel", type: "text", placeholder: "Secondary button label" },
      { group: "contentConfig", path: "secondaryHref", type: "text", placeholder: "Secondary button link" },
      { group: "contentConfig", path: "backgroundImage", type: "text", placeholder: "Background image URL", colSpan: 2 },
    ],
  },
  logoCloud: {
    key: "logoCloud",
    label: "Logo Cloud",
    category: "social-proof",
    supportedVariants: ["default"],
    allowMultiple: false,
    presets: [{ value: "default", label: "Partner Logo Strip" }],
    editorSchema: [
      { group: "contentConfig", path: "title", type: "text", placeholder: "Logo section label" },
      { group: "contentConfig", path: "backgroundColor", type: "text", placeholder: "Background color" },
      {
        group: "contentConfig",
        path: "logos",
        type: "stringList",
        placeholder: "One logo URL or path per line",
        rows: 4,
        colSpan: 2,
      },
    ],
  },
};

const buildSectionProps = (section) => {
  const contentConfig = section.contentConfig || {};
  const dataConfig = section.dataConfig || {};

  if (section.type === "hero") {
    return {
      eyebrow: contentConfig.eyebrow,
      headlineScript: contentConfig.headlineScript,
      primaryCtaLabel: contentConfig.primaryCtaLabel,
      primaryCtaHref: contentConfig.primaryCtaHref,
      secondaryCtaLabel: contentConfig.secondaryCtaLabel,
      secondaryCtaHref: contentConfig.secondaryCtaHref,
    };
  }

  if (section.type === "blogPreview") {
    return {
      maxPerCategory: dataConfig.maxPerCategory ?? 3,
      searchPlaceholder: contentConfig.searchPlaceholder,
      emptyTitle: contentConfig.emptyTitle,
      emptyDescription: contentConfig.emptyDescription,
      groupLabels: contentConfig.groupLabels,
    };
  }

  if (section.type === "trending") {
    return {
      heading: contentConfig.heading,
    };
  }

  if (section.type === "about") {
    return {
      introLabel: contentConfig.introLabel,
      brandName: contentConfig.brandName,
      leadHeading: contentConfig.leadHeading,
      bodyText: contentConfig.bodyText,
      closingHeading: contentConfig.closingHeading,
      cards: contentConfig.cards,
    };
  }

  if (section.type === "groupTours") {
    return {
      prefixLabel: contentConfig.prefixLabel,
      scriptLabel: contentConfig.scriptLabel,
      suffixLabel: contentConfig.suffixLabel,
      bookingLabel: contentConfig.bookingLabel,
      itineraryLabel: contentConfig.itineraryLabel,
      capacityLabel: contentConfig.capacityLabel,
    };
  }

  if (section.type === "featuredPackages") {
    return {
      prefixLabel: contentConfig.prefixLabel || "Our",
      scriptLabel: contentConfig.scriptLabel || "popular",
      suffixLabel: contentConfig.suffixLabel || "Expeditions",
      limit: dataConfig.limit ?? 6,
    };
  }

  if (section.type === "cta") {
    return {
      heading: contentConfig.heading,
      subheading: contentConfig.subheading,
      description: contentConfig.description,
      primaryLabel: contentConfig.primaryLabel,
      primaryHref: contentConfig.primaryHref,
      secondaryLabel: contentConfig.secondaryLabel,
      secondaryHref: contentConfig.secondaryHref,
      backgroundImage: contentConfig.backgroundImage,
    };
  }

  if (section.type === "destinations") {
    return {
      title: contentConfig.title,
      subtitle: contentConfig.subtitle,
      description: contentConfig.description,
      quote: contentConfig.quote,
      quoteAuthor: contentConfig.quoteAuthor,
    };
  }

  if (section.type === "testimonials") {
    return {
      backgroundImage: contentConfig.backgroundImage,
      ratingLabel: contentConfig.ratingLabel,
      reviewCountLabel: contentConfig.reviewCountLabel,
      providerLabel: contentConfig.providerLabel,
      testimonials: contentConfig.testimonials,
    };
  }

  if (section.type === "logoCloud") {
    return {
      logos: contentConfig.logos,
      backgroundColor: contentConfig.backgroundColor,
      title: contentConfig.title,
    };
  }

  return {};
};

export const sectionRegistry = {
  metadata,
  getComponent: (type) => sectionComponents[type] || null,
  getProps: buildSectionProps,
};

export const renderRegisteredSection = (section) => {
  const Component = sectionRegistry.getComponent(section.type);
  if (!Component) {
    return null;
  }

  return <Component {...sectionRegistry.getProps(section)} />;
};
