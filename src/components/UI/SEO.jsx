import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  ogImage, 
  canonicalUrl, 
  schema,
  type = 'website' 
}) => {
  const siteName = 'Makolo Afrika - Luxury Tours & Safaris';
  const defaultDescription = 'Experience the best luxury safaris and adventure tours in Tanzania with Makolo Afrika. Explore the Serengeti, Ngorongoro, Kilimanjaro, and Zanzibar.';
  
  // Format title
  const fullTitle = title 
    ? `${title} | Makolo Afrika` 
    : siteName;

  // Standard Company / Site Schemas if on Home or generic
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Makolo Afrika",
    "alternateName": "Makolo Afrika Luxury Safaris",
    "url": "https://makoloafrika.com",
    "logo": "https://makoloafrika.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+255-752-000-000",
      "contactType": "customer service",
      "areaServed": "TZ",
      "availableLanguage": ["English", "Swahili"]
    },
    "sameAs": [
      "https://www.facebook.com/makoloafrika",
      "https://www.instagram.com/makoloafrika",
      "https://twitter.com/makoloafrika"
    ]
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={Array.isArray(keywords) ? keywords.join(', ') : keywords} />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:site_name" content="Makolo Afrika" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Default Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify(orgSchema)}
      </script>

      {/* Page Specific Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {schema}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
