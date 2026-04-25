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

const BlogDetail = React.lazy(() => import("../../components/Blogs/BlogDetail"));
const PackageDetail = React.lazy(() => import("../../components/Blogs/PackageDetail"));

const sectionComponents = {
  hero: CinematicHeroSection,
  trending: Trending,
  about: Welcome,
  featuredPackages: PopularTours,
  groupTours: GroupTours,
  blogPreview: BlogsComp,
  blogDetail: BlogDetail,
  destinations: AfricanDestinations,
  testimonials: Testimonial,
  tourDetail: PackageDetail,
  cta: TripCtaSection,
  logoCloud: LogoSlider,
};

const sharedStyleSchema = [
  {
    group: "styleConfig",
    path: "backgroundColor",
    type: "text",
    placeholder: "Background color",
  },
  {
    group: "styleConfig",
    path: "textColor",
    type: "text",
    placeholder: "Text color",
  },
  {
    group: "styleConfig",
    path: "spacingPreset",
    type: "select",
    placeholder: "Spacing preset",
    options: [
      { value: "", label: "Theme Default" },
      { value: "compact", label: "Compact" },
      { value: "comfortable", label: "Comfortable" },
      { value: "spacious", label: "Spacious" },
    ],
  },
  {
    group: "styleConfig",
    path: "paddingTop",
    type: "number",
    placeholder: "Top padding (px)",
    min: 0,
    max: 240,
    fallbackValue: 0,
  },
  {
    group: "styleConfig",
    path: "paddingBottom",
    type: "number",
    placeholder: "Bottom padding (px)",
    min: 0,
    max: 240,
    fallbackValue: 0,
  },
  {
    group: "styleConfig",
    path: "textAlign",
    type: "select",
    placeholder: "Text alignment",
    options: [
      { value: "", label: "Theme Default" },
      { value: "left", label: "Left" },
      { value: "center", label: "Center" },
      { value: "right", label: "Right" },
    ],
  },
  {
    group: "styleConfig",
    path: "containerWidth",
    type: "select",
    placeholder: "Container width",
    options: [
      { value: "", label: "Theme Default" },
      { value: "narrow", label: "Narrow" },
      { value: "standard", label: "Standard" },
      { value: "wide", label: "Wide" },
      { value: "full", label: "Full Width" },
    ],
  },
  {
    group: "styleConfig",
    path: "borderRadius",
    type: "select",
    placeholder: "Surface radius",
    options: [
      { value: "", label: "Theme Default" },
      { value: "none", label: "None" },
      { value: "md", label: "Medium" },
      { value: "xl", label: "Extra Large" },
      { value: "3xl", label: "3X Large" },
    ],
  },
  {
    group: "styleConfig",
    path: "shadowLevel",
    type: "select",
    placeholder: "Shadow level",
    options: [
      { value: "", label: "Theme Default" },
      { value: "none", label: "None" },
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
      { value: "lg", label: "Large" },
    ],
  },
];

const metadata = {
  hero: {
    key: "hero",
    label: "Hero",
    category: "marketing",
    supportedVariants: ["cinematic", "split-panel", "image-slideshow"],
    allowMultiple: false,
    presets: [
      { value: "cinematic", label: "Cinematic Hero" },
      { value: "split-panel", label: "Split Panel Hero" },
      { value: "image-slideshow", label: "Image Slideshow Hero" },
    ],
    editorSchema: [
      { group: "contentConfig", path: "eyebrow", type: "text", placeholder: "Eyebrow text" },
      { group: "contentConfig", path: "headlineScript", type: "text", placeholder: "Script headline" },
      { group: "contentConfig", path: "primaryCtaLabel", type: "text", placeholder: "Primary CTA label" },
      { group: "contentConfig", path: "primaryCtaHref", type: "text", placeholder: "Primary CTA link" },
      { group: "contentConfig", path: "secondaryCtaLabel", type: "text", placeholder: "Secondary CTA label" },
      { group: "contentConfig", path: "secondaryCtaHref", type: "text", placeholder: "Secondary CTA link" },
      { group: "contentConfig", path: "videoUrl", type: "media", placeholder: "Background video URL (e.g., /api/media/ID)" },
      { group: "contentConfig", path: "backgroundImage", type: "media", placeholder: "Static background image (fallback)" },
    ],
    styleSchema: sharedStyleSchema,
    variantSchemas: {
      "image-slideshow": {
        editorSchema: [
          { group: "contentConfig", path: "eyebrow", type: "text", placeholder: "Eyebrow text" },
          { group: "contentConfig", path: "headlineScript", type: "text", placeholder: "Headline" },
          { group: "contentConfig", path: "description", type: "textarea", placeholder: "Description", rows: 4, colSpan: 2 },
          { group: "contentConfig", path: "primaryCtaLabel", type: "text", placeholder: "Primary CTA label" },
          { group: "contentConfig", path: "primaryCtaHref", type: "text", placeholder: "Primary CTA link" },
          { group: "contentConfig", path: "secondaryCtaLabel", type: "text", placeholder: "Secondary CTA label" },
          { group: "contentConfig", path: "secondaryCtaHref", type: "text", placeholder: "Secondary CTA link" },
          {
            group: "contentConfig",
            path: "slides",
            type: "objectList",
            itemLabel: "Slide",
            limit: 5,
            fields: [
              { path: "image", type: "media", placeholder: "Slide image" },
              { path: "caption", type: "text", placeholder: "Optional caption" },
            ],
          },
          { group: "contentConfig", path: "backgroundImage", type: "media", placeholder: "Fallback background image" },
        ],
      },
      "split-panel": {
        editorSchema: [
          { group: "contentConfig", path: "eyebrow", type: "text", placeholder: "Eyebrow text" },
          { group: "contentConfig", path: "headlineScript", type: "text", placeholder: "Headline" },
          { group: "contentConfig", path: "description", type: "textarea", placeholder: "Description", rows: 4, colSpan: 2 },
          { group: "contentConfig", path: "primaryCtaLabel", type: "text", placeholder: "Primary CTA label" },
          { group: "contentConfig", path: "primaryCtaHref", type: "text", placeholder: "Primary CTA link" },
          { group: "contentConfig", path: "secondaryCtaLabel", type: "text", placeholder: "Secondary CTA label" },
          { group: "contentConfig", path: "secondaryCtaHref", type: "text", placeholder: "Secondary CTA link" },
          { group: "contentConfig", path: "panelEyebrow", type: "text", placeholder: "Panel eyebrow" },
          { group: "contentConfig", path: "panelTitle", type: "text", placeholder: "Panel title" },
          { group: "contentConfig", path: "panelBody", type: "textarea", placeholder: "Panel body", rows: 4, colSpan: 2 },
          { group: "contentConfig", path: "panelHighlights", type: "stringList", placeholder: "One panel highlight per line", rows: 4, colSpan: 2 },
          { group: "contentConfig", path: "videoUrl", type: "media", placeholder: "Background video URL" },
          { group: "contentConfig", path: "backgroundImage", type: "media", placeholder: "Fallback background image" },
        ],
      },
    },
  },
  trending: {
    key: "trending",
    label: "Trending",
    category: "social-proof",
    supportedVariants: ["default", "magazine-strip"],
    allowMultiple: false,
    presets: [
      { value: "default", label: "Trending Carousel" },
      { value: "magazine-strip", label: "Magazine Strip" },
    ],
    editorSchema: [
      { group: "contentConfig", path: "heading", type: "text", placeholder: "Trending heading", colSpan: 2 },
    ],
    styleSchema: sharedStyleSchema,
    variantSchemas: {
      "magazine-strip": {
        editorSchema: [
          { group: "contentConfig", path: "heading", type: "text", placeholder: "Trending heading", colSpan: 2 },
          { group: "contentConfig", path: "eyebrow", type: "text", placeholder: "Section eyebrow", colSpan: 2 },
          { group: "contentConfig", path: "description", type: "textarea", placeholder: "Section description", rows: 4, colSpan: 2 },
        ],
      },
    },
  },
  about: {
    key: "about",
    label: "About / Welcome",
    category: "brand-story",
    supportedVariants: ["welcome", "editorial-mosaic"],
    allowMultiple: false,
    presets: [
      { value: "welcome", label: "Welcome Story" },
      { value: "editorial-mosaic", label: "Editorial Mosaic" },
    ],
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
          { path: "image", type: "media", placeholder: "Card image" },
          { path: "description", type: "textarea", placeholder: "Description", rows: 3, colSpan: 2 },
        ],
      },
    ],
    styleSchema: sharedStyleSchema,
    variantSchemas: {
      "editorial-mosaic": {
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
            itemLabel: "Story Card",
            limit: 4,
            fields: [
              { path: "scriptLabel", type: "text", placeholder: "Script label" },
              { path: "title", type: "text", placeholder: "Title" },
              { path: "image", type: "media", placeholder: "Card image" },
              { path: "description", type: "textarea", placeholder: "Description", rows: 3, colSpan: 2 },
            ],
          },
        ],
      },
    },
  },
  featuredPackages: {
    key: "featuredPackages",
    label: "Featured Packages",
    category: "packages",
    supportedVariants: ["popular-grid", "featured-list"],
    allowMultiple: false,
    presets: [
      { value: "popular-grid", label: "Popular Grid" },
      { value: "featured-list", label: "Featured List" },
    ],
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
    styleSchema: sharedStyleSchema,
    variantSchemas: {
      "featured-list": {
        editorSchema: [
          { group: "contentConfig", path: "prefixLabel", type: "text", placeholder: "Prefix label" },
          { group: "contentConfig", path: "scriptLabel", type: "text", placeholder: "Script label" },
          { group: "contentConfig", path: "suffixLabel", type: "text", placeholder: "Suffix label" },
          { group: "contentConfig", path: "introText", type: "textarea", placeholder: "Intro text", rows: 4, colSpan: 2 },
          {
            group: "dataConfig",
            path: "limit",
            type: "number",
            placeholder: "Number of packages",
            min: 1,
            max: 8,
            fallbackValue: 4,
          },
        ],
      },
    },
  },
  groupTours: {
    key: "groupTours",
    label: "Group Tours",
    category: "packages",
    supportedVariants: ["default", "spotlight-cards"],
    allowMultiple: false,
    presets: [
      { value: "default", label: "Group Tours List" },
      { value: "spotlight-cards", label: "Spotlight Cards" },
    ],
    editorSchema: [
      { group: "contentConfig", path: "prefixLabel", type: "text", placeholder: "Prefix label" },
      { group: "contentConfig", path: "scriptLabel", type: "text", placeholder: "Script label" },
      { group: "contentConfig", path: "suffixLabel", type: "text", placeholder: "Suffix label" },
      { group: "contentConfig", path: "capacityLabel", type: "text", placeholder: "Capacity label" },
      { group: "contentConfig", path: "bookingLabel", type: "text", placeholder: "Booking label" },
      { group: "contentConfig", path: "itineraryLabel", type: "text", placeholder: "Itinerary label" },
    ],
    styleSchema: sharedStyleSchema,
    variantSchemas: {
      "spotlight-cards": {
        editorSchema: [
          { group: "contentConfig", path: "prefixLabel", type: "text", placeholder: "Prefix label" },
          { group: "contentConfig", path: "scriptLabel", type: "text", placeholder: "Script label" },
          { group: "contentConfig", path: "suffixLabel", type: "text", placeholder: "Suffix label" },
          { group: "contentConfig", path: "sectionIntro", type: "textarea", placeholder: "Section intro", rows: 4, colSpan: 2 },
          { group: "contentConfig", path: "bookingLabel", type: "text", placeholder: "Booking label" },
          { group: "contentConfig", path: "itineraryLabel", type: "text", placeholder: "Itinerary label" },
          { group: "contentConfig", path: "capacityLabel", type: "text", placeholder: "Capacity label" },
          {
            group: "dataConfig",
            path: "limit",
            type: "number",
            placeholder: "Number of group tours",
            min: 1,
            max: 6,
            fallbackValue: 3,
          },
        ],
      },
    },
  },
  blogPreview: {
    key: "blogPreview",
    label: "Blog Preview",
    category: "content",
    supportedVariants: ["category-grid", "editorial-list"],
    allowMultiple: false,
    presets: [
      { value: "category-grid", label: "Category Grid" },
      { value: "editorial-list", label: "Editorial List" },
    ],
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
    styleSchema: sharedStyleSchema,
    variantSchemas: {
      "editorial-list": {
        editorSchema: [
          { group: "contentConfig", path: "sectionEyebrow", type: "text", placeholder: "Section eyebrow", colSpan: 2 },
          { group: "contentConfig", path: "sectionTitle", type: "text", placeholder: "Section title", colSpan: 2 },
          { group: "contentConfig", path: "sectionDescription", type: "textarea", placeholder: "Section description", rows: 4, colSpan: 2 },
          { group: "contentConfig", path: "searchPlaceholder", type: "text", placeholder: "Search placeholder", colSpan: 2 },
          { group: "contentConfig", path: "emptyTitle", type: "text", placeholder: "Empty state title" },
          { group: "contentConfig", path: "emptyDescription", type: "text", placeholder: "Empty state description" },
          {
            group: "dataConfig",
            path: "maxPerCategory",
            type: "number",
            placeholder: "Posts per group",
            min: 1,
            max: 6,
            fallbackValue: 3,
          },
        ],
      },
    },
  },
  destinations: {
    key: "destinations",
    label: "Destinations",
    category: "content",
    supportedVariants: ["quote-list", "destination-grid"],
    allowMultiple: false,
    presets: [
      { value: "quote-list", label: "Quote List" },
      { value: "destination-grid", label: "Destination Grid" },
    ],
    editorSchema: [
      { group: "contentConfig", path: "title", type: "text", placeholder: "Section title" },
      { group: "contentConfig", path: "subtitle", type: "text", placeholder: "Section subtitle" },
      { group: "contentConfig", path: "description", type: "textarea", placeholder: "Section description", rows: 3, colSpan: 2 },
      { group: "contentConfig", path: "quote", type: "textarea", placeholder: "Highlight quote", rows: 3 },
      { group: "contentConfig", path: "quoteAuthor", type: "text", placeholder: "Quote author" },
      { group: "contentConfig", path: "backgroundImage", type: "media", placeholder: "Section background image" },
    ],
    styleSchema: sharedStyleSchema,
    variantSchemas: {
      "destination-grid": {
        editorSchema: [
          { group: "contentConfig", path: "title", type: "text", placeholder: "Section title", colSpan: 2 },
          { group: "contentConfig", path: "subtitle", type: "text", placeholder: "Section subtitle", colSpan: 2 },
          { group: "contentConfig", path: "description", type: "textarea", placeholder: "Section description", rows: 4, colSpan: 2 },
        ],
      },
    },
  },
  testimonials: {
    key: "testimonials",
    label: "Testimonials",
    category: "social-proof",
    supportedVariants: ["default", "editorial-quotes"],
    allowMultiple: false,
    presets: [
      { value: "default", label: "Review Card Slider" },
      { value: "editorial-quotes", label: "Editorial Quotes" },
    ],
    editorSchema: [
      { group: "contentConfig", path: "backgroundImage", type: "media", placeholder: "Background image URL", colSpan: 2 },
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
          { path: "img", type: "media", placeholder: "Reviewer avatar" },
          { path: "text", type: "textarea", placeholder: "Text", rows: 3, colSpan: 2 },
        ],
      },
    ],
    styleSchema: sharedStyleSchema,
    variantSchemas: {
      "editorial-quotes": {
        editorSchema: [
          { group: "contentConfig", path: "sectionEyebrow", type: "text", placeholder: "Section eyebrow", colSpan: 2 },
          { group: "contentConfig", path: "sectionTitle", type: "text", placeholder: "Section title", colSpan: 2 },
          { group: "contentConfig", path: "sectionDescription", type: "textarea", placeholder: "Section description", rows: 4, colSpan: 2 },
          {
            group: "contentConfig",
            path: "testimonials",
            type: "objectList",
            itemLabel: "Quote",
            limit: 3,
            fields: [
              { path: "name", type: "text", placeholder: "Name" },
              { path: "date", type: "text", placeholder: "Date" },
              { path: "img", type: "media", placeholder: "Reviewer avatar" },
              { path: "text", type: "textarea", placeholder: "Quote text", rows: 4, colSpan: 2 },
            ],
          },
        ],
      },
    },
  },
  cta: {
    key: "cta",
    label: "Call To Action",
    category: "conversion",
    supportedVariants: ["trip-cta", "split-invite"],
    allowMultiple: false,
    presets: [
      { value: "trip-cta", label: "Trip CTA Banner" },
      { value: "split-invite", label: "Split Invite Card" },
    ],
    editorSchema: [
      { group: "contentConfig", path: "heading", type: "text", placeholder: "Heading" },
      { group: "contentConfig", path: "subheading", type: "text", placeholder: "Subheading" },
      { group: "contentConfig", path: "description", type: "textarea", placeholder: "Description", rows: 3, colSpan: 2 },
      { group: "contentConfig", path: "primaryLabel", type: "text", placeholder: "Primary button label" },
      { group: "contentConfig", path: "primaryHref", type: "text", placeholder: "Primary button link" },
      { group: "contentConfig", path: "secondaryLabel", type: "text", placeholder: "Secondary button label" },
      { group: "contentConfig", path: "secondaryHref", type: "text", placeholder: "Secondary button link" },
      { group: "contentConfig", path: "backgroundImage", type: "media", placeholder: "Background image URL", colSpan: 2 },
    ],
    styleSchema: sharedStyleSchema,
    variantSchemas: {
      "split-invite": {
        editorSchema: [
          { group: "contentConfig", path: "heading", type: "text", placeholder: "Heading", colSpan: 2 },
          { group: "contentConfig", path: "subheading", type: "text", placeholder: "Subheading", colSpan: 2 },
          { group: "contentConfig", path: "description", type: "textarea", placeholder: "Description", rows: 4, colSpan: 2 },
          { group: "contentConfig", path: "primaryLabel", type: "text", placeholder: "Primary button label" },
          { group: "contentConfig", path: "primaryHref", type: "text", placeholder: "Primary button link" },
          { group: "contentConfig", path: "secondaryLabel", type: "text", placeholder: "Secondary button label" },
          { group: "contentConfig", path: "secondaryHref", type: "text", placeholder: "Secondary button link" },
          { group: "contentConfig", path: "accentLabel", type: "text", placeholder: "Accent label", colSpan: 2 },
          { group: "contentConfig", path: "backgroundImage", type: "media", placeholder: "Background image URL", colSpan: 2 },
        ],
      },
    },
  },
  logoCloud: {
    key: "logoCloud",
    label: "Logo Cloud",
    category: "social-proof",
    supportedVariants: ["default", "badge-grid"],
    allowMultiple: false,
    presets: [
      { value: "default", label: "Partner Logo Strip" },
      { value: "badge-grid", label: "Partner Badge Grid" },
    ],
    editorSchema: [
      { group: "contentConfig", path: "title", type: "text", placeholder: "Logo section label" },
      { group: "contentConfig", path: "backgroundColor", type: "text", placeholder: "Background color" },
      {
        group: "contentConfig",
        path: "logos",
        type: "objectList",
        itemLabel: "Partner Logo",
        limit: 12,
        fields: [
          { path: "image", type: "media", placeholder: "Logo image" },
          { path: "alt", type: "text", placeholder: "Partner name" },
        ],
      },
    ],
    styleSchema: sharedStyleSchema,
    variantSchemas: {
      "badge-grid": {
        editorSchema: [
          { group: "contentConfig", path: "title", type: "text", placeholder: "Section title", colSpan: 2 },
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
    },
  },
  tourDetail: {
    key: "tourDetail",
    label: "Tour Detail",
    category: "dynamic-pages",
    supportedVariants: ["default"],
    allowMultiple: false,
    presets: [{ value: "default", label: "Tour Detail Template" }],
    editorSchema: [
      {
        group: "contentConfig",
        path: "notes",
        type: "textarea",
        placeholder: "This section uses the live tour detail template for the current tour URL.",
        rows: 3,
        colSpan: 2,
      },
    ],
    styleSchema: sharedStyleSchema,
  },
  blogDetail: {
    key: "blogDetail",
    label: "Blog Detail",
    category: "dynamic-pages",
    supportedVariants: ["default"],
    allowMultiple: false,
    presets: [{ value: "default", label: "Blog Detail Template" }],
    editorSchema: [
      {
        group: "contentConfig",
        path: "notes",
        type: "textarea",
        placeholder: "This section uses the live blog detail template for the current blog URL.",
        rows: 3,
        colSpan: 2,
      },
    ],
    styleSchema: sharedStyleSchema,
  },
};

const buildSectionProps = (section) => {
  const contentConfig = section.contentConfig || {};
  const dataConfig = section.dataConfig || {};

  if (section.type === "hero") {
    return {
      variant: section.variant,
      eyebrow: contentConfig.eyebrow,
      headlineScript: contentConfig.headlineScript,
      description: contentConfig.description,
      primaryCtaLabel: contentConfig.primaryCtaLabel,
      primaryCtaHref: contentConfig.primaryCtaHref,
      secondaryCtaLabel: contentConfig.secondaryCtaLabel,
      secondaryCtaHref: contentConfig.secondaryCtaHref,
      panelEyebrow: contentConfig.panelEyebrow,
      panelTitle: contentConfig.panelTitle,
      panelBody: contentConfig.panelBody,
      panelHighlights: contentConfig.panelHighlights,
      imageSlides: contentConfig.imageSlides || contentConfig.slides?.map(s => s.image),
      videoUrl: contentConfig.videoUrl,
      backgroundImage: contentConfig.backgroundImage,
    };
  }

  if (section.type === "blogPreview") {
    return {
      variant: section.variant,
      maxPerCategory: dataConfig.maxPerCategory ?? 3,
      searchPlaceholder: contentConfig.searchPlaceholder,
      emptyTitle: contentConfig.emptyTitle,
      emptyDescription: contentConfig.emptyDescription,
      sectionEyebrow: contentConfig.sectionEyebrow,
      sectionTitle: contentConfig.sectionTitle,
      sectionDescription: contentConfig.sectionDescription,
      groupLabels: contentConfig.groupLabels,
    };
  }

  if (section.type === "trending") {
    return {
      variant: section.variant,
      heading: contentConfig.heading,
      eyebrow: contentConfig.eyebrow,
      description: contentConfig.description,
    };
  }

  if (section.type === "about") {
    return {
      variant: section.variant,
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
      variant: section.variant,
      prefixLabel: contentConfig.prefixLabel,
      scriptLabel: contentConfig.scriptLabel,
      suffixLabel: contentConfig.suffixLabel,
      sectionIntro: contentConfig.sectionIntro,
      bookingLabel: contentConfig.bookingLabel,
      itineraryLabel: contentConfig.itineraryLabel,
      capacityLabel: contentConfig.capacityLabel,
      limit: dataConfig.limit,
    };
  }

  if (section.type === "featuredPackages") {
    return {
      variant: section.variant,
      prefixLabel: contentConfig.prefixLabel || "Our",
      scriptLabel: contentConfig.scriptLabel || "popular",
      suffixLabel: contentConfig.suffixLabel || "Expeditions",
      introText: contentConfig.introText,
      limit: dataConfig.limit ?? 6,
    };
  }

  if (section.type === "cta") {
    return {
      variant: section.variant,
      heading: contentConfig.heading,
      subheading: contentConfig.subheading,
      description: contentConfig.description,
      primaryLabel: contentConfig.primaryLabel,
      primaryHref: contentConfig.primaryHref,
      secondaryLabel: contentConfig.secondaryLabel,
      secondaryHref: contentConfig.secondaryHref,
      accentLabel: contentConfig.accentLabel,
      backgroundImage: contentConfig.backgroundImage,
    };
  }

  if (section.type === "destinations") {
    return {
      variant: section.variant,
      title: contentConfig.title,
      subtitle: contentConfig.subtitle,
      description: contentConfig.description,
      quote: contentConfig.quote,
      quoteAuthor: contentConfig.quoteAuthor,
      backgroundImage: contentConfig.backgroundImage,
    };
  }

  if (section.type === "testimonials") {
    return {
      variant: section.variant,
      backgroundImage: contentConfig.backgroundImage,
      ratingLabel: contentConfig.ratingLabel,
      reviewCountLabel: contentConfig.reviewCountLabel,
      providerLabel: contentConfig.providerLabel,
      sectionEyebrow: contentConfig.sectionEyebrow,
      sectionTitle: contentConfig.sectionTitle,
      sectionDescription: contentConfig.sectionDescription,
      testimonials: contentConfig.testimonials,
    };
  }

  if (section.type === "logoCloud") {
    return {
      variant: section.variant,
      logos: contentConfig.logos?.map(l => typeof l === 'string' ? l : l.image) || [],
      backgroundColor: contentConfig.backgroundColor,
      title: contentConfig.title,
    };
  }

  return {};
};

const getVariantSchema = (type, variant, schemaKey) => {
  const meta = metadata[type] || {};
  const variantSchema =
    variant && meta.variantSchemas?.[variant]?.[schemaKey];

  return variantSchema || meta[schemaKey] || [];
};

export const sectionRegistry = {
  metadata,
  getComponent: (type) => sectionComponents[type] || null,
  getProps: buildSectionProps,
  getEditorSchema: (type, variant) => getVariantSchema(type, variant, "editorSchema"),
  getStyleSchema: (type, variant) => getVariantSchema(type, variant, "styleSchema"),
};

export const renderRegisteredSection = (section) => {
  const Component = sectionRegistry.getComponent(section.type);
  if (!Component) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <Component {...sectionRegistry.getProps(section)} />
    </React.Suspense>
  );
};
