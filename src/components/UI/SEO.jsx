import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  SITE_URL,
  buildWebPageSchema,
  parseJsonLd,
  resolveCanonicalUrl,
  resolveImageUrl,
} from "../../utils/seo";

const SEO = ({ 
  title, 
  description, 
  keywords, 
  ogImage, 
  canonicalUrl, 
  schema,
  type = 'website' 
}) => {
  const siteName = 'MAZ Expeditions - Luxury Tours & Safaris';
  const defaultDescription = 'Experience the best luxury safaris and adventure tours in Tanzania with MAZ Expeditions. Explore the Serengeti, Ngorongoro, Kilimanjaro, and Zanzibar.';
  
  // Format title
  const hasBrandInTitle = typeof title === "string" && /maz expeditions/i.test(title);
  const fullTitle = title
    ? (hasBrandInTitle ? title : `${title} | MAZ Expeditions`)
    : siteName;

  const resolvedCanonicalUrl = resolveCanonicalUrl(canonicalUrl);
  const resolvedOgImage = resolveImageUrl(ogImage);
  const isHomePage =
    resolvedCanonicalUrl === SITE_URL || resolvedCanonicalUrl === `${SITE_URL}/`;
  const resolvedSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      "name": "MAZ Expeditions",
      "alternateName": "MAZ Expeditions Luxury Safaris",
      "url": SITE_URL,
      "logo": `${SITE_URL}/logo.png`,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+255-752-000-000",
        "contactType": "customer service",
        "areaServed": "TZ",
        "availableLanguage": ["English", "Swahili"]
      },
      "sameAs": [
        "https://www.facebook.com/mazexpeditions",
        "https://www.instagram.com/mazexpeditions",
        "https://twitter.com/mazexpeditions"
      ]
    },
    isHomePage
      ? {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "MAZ Expeditions",
          "url": SITE_URL,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${SITE_URL}/blogs?search={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        }
      : buildWebPageSchema({
          title: fullTitle,
          description: description || defaultDescription,
          path: resolvedCanonicalUrl,
          image: resolvedOgImage,
          type: type === "website" ? "CollectionPage" : "WebPage",
        }),
    ...parseJsonLd(schema),
  ].filter(Boolean);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={Array.isArray(keywords) ? keywords.join(', ') : keywords} />}
      <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      <meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={resolvedCanonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:url" content={resolvedCanonicalUrl} />
      {resolvedOgImage && <meta property="og:image" content={resolvedOgImage} />}
      <meta property="og:site_name" content="MAZ Expeditions" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      {resolvedOgImage && <meta name="twitter:image" content={resolvedOgImage} />}

      {resolvedSchemas.map((item, index) => (
        <script key={`schema-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
