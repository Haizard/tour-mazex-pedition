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
  hero: { key: "hero", label: "Hero", category: "marketing", supportedVariants: ["cinematic"] },
  trending: { key: "trending", label: "Trending", category: "social-proof", supportedVariants: ["default"] },
  about: { key: "about", label: "About / Welcome", category: "brand-story", supportedVariants: ["welcome"] },
  featuredPackages: { key: "featuredPackages", label: "Featured Packages", category: "packages", supportedVariants: ["popular-grid"] },
  groupTours: { key: "groupTours", label: "Group Tours", category: "packages", supportedVariants: ["default"] },
  blogPreview: { key: "blogPreview", label: "Blog Preview", category: "content", supportedVariants: ["category-grid"] },
  destinations: { key: "destinations", label: "Destinations", category: "content", supportedVariants: ["quote-list"] },
  testimonials: { key: "testimonials", label: "Testimonials", category: "social-proof", supportedVariants: ["default"] },
  cta: { key: "cta", label: "Call To Action", category: "conversion", supportedVariants: ["trip-cta"] },
  logoCloud: { key: "logoCloud", label: "Logo Cloud", category: "social-proof", supportedVariants: ["default"] },
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
