export const HOME_PAGE_DEFAULT = {
  pageType: "home",
  slug: "/",
  title: "Home",
  status: "published",
  seo: {
    title: "Tanzania Luxury Safaris & Adventure Tours",
    description:
      "MAZ Expeditions offers premium safari experiences in Serengeti, Ngorongoro, and Zanzibar. Book your dream African holiday today.",
    keywords: [
      "Safari",
      "Tanzania",
      "Serengeti",
      "Zanzibar",
      "Luxury Travel",
      "MAZ Expeditions",
    ],
  },
  sections: [
    {
      type: "hero",
      variant: "cinematic",
      order: 1,
      enabled: true,
      dataConfig: {
        backgroundMediaType: "video",
      },
      contentConfig: {
        eyebrow: "Karibu Maz",
        headlineScript: "Expeditions",
        description:
          "Private safaris, Kilimanjaro adventures, and custom East Africa journeys planned around your pace, style, and story.",
        primaryCtaLabel: "START PLANNING NOW",
        primaryCtaHref: "/plan-my-trip",
        secondaryCtaLabel: "Explore All Packages",
        secondaryCtaHref: "/packages",
        panelEyebrow: "Tailor-Made Trips",
        panelTitle: "Build a homepage that sells the journey before the itinerary.",
        panelBody:
          "Use the split-panel hero when you want more story, more trust signals, and a stronger premium call to action above the fold.",
        panelHighlights: [
          "Ideal for custom itinerary brands",
          "Extra room for trust-building copy",
          "Balances storytelling with strong CTAs",
        ],
        imageSlides: [
          "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80",
        ],
      },
      styleConfig: {
        minHeight: "screen",
      },
    },
    {
      type: "trending",
      variant: "default",
      order: 2,
      enabled: true,
      dataConfig: {},
      contentConfig: {
        heading: "Our Popular Expeditions",
        eyebrow: "Trending Now",
        description:
          "Use the magazine strip when you want current best-sellers to feel more editorial and premium above the fold.",
      },
      styleConfig: {},
    },
    {
      type: "about",
      variant: "welcome",
      order: 3,
      enabled: true,
      dataConfig: {},
      contentConfig: {
        introLabel: "Welcome to",
        brandName: "MAZ Expeditions",
        leadHeading:
          "Experience the transformative power of travel with MAZ Expeditions, a journey that enriches your soul while fostering the preservation of Africa's vibrant communities, pristine environments, and majestic wildlife.",
        bodyText:
          "MAZ Expeditions is a locally rooted African safari company built around thoughtful planning, personal service, and tailor-made adventures. We shape each itinerary around your interests, carefully choosing the places, pace, and experiences that fit you best. On your private journey, we create a close, memorable experience led by knowledgeable local professionals who know these landscapes deeply. Traveling with MAZ Expeditions means exploring Tanzania with a team that values authenticity, safety, and lasting impact for both travelers and the communities connected to each journey.",
        closingHeading:
          "Experience the unmatched luxury of Africa's wilderness with MAZ Expeditions.",
        cards: [
          {
            title: "Explore Our Kilimanjaro Packages",
            description:
              "Conquer Africa's highest peak with our Kilimanjaro trekking packages. Whether you're a seasoned climber or a beginner, our expert guides ensure a safe, unforgettable journey to the summit. Choose your route and start your adventure today.",
            scriptLabel: "",
          },
          {
            title: "Explore Our Safari Packages",
            description:
              "Join us on an unforgettable safari adventure. Discover Africa's wildlife and stunning landscapes, from the Serengeti to the Ngorongoro Crater. Our tailored safari packages promise an experience you'll never forget.",
            scriptLabel: "",
          },
          {
            title: "Experience, Expertise, and Research",
            description:
              "Born from a passion for travel and shaped by deep local experience, MAZ Expeditions creates meaningful African journeys with a strong focus on authenticity, care, and unforgettable memories for every traveler.",
            scriptLabel: "About us",
          },
          {
            title: "Best African safari with kids",
            description: "",
            scriptLabel: "Family Safaris",
          },
        ],
      },
      styleConfig: {},
    },
    {
      type: "featuredPackages",
      variant: "popular-grid",
      order: 4,
      enabled: true,
      dataConfig: {
        source: "tours",
        limit: 6,
      },
      contentConfig: {
        prefixLabel: "Our",
        scriptLabel: "popular",
        suffixLabel: "Expeditions",
        introText:
          "Browse the itineraries travelers ask for most, from classic wildlife circuits to premium private journeys shaped around standout moments.",
      },
      styleConfig: {},
    },
    {
      type: "groupTours",
      variant: "default",
      order: 5,
      enabled: true,
      dataConfig: {
        source: "group-tours",
      },
      contentConfig: {
        prefixLabel: "Our",
        scriptLabel: "Group",
        suffixLabel: "Tours",
        sectionIntro:
          "Perfect for travelers who want a fixed departure, shared energy, and a stronger sense of occasion around each itinerary.",
        bookingLabel: "Book Now",
        itineraryLabel: "See Itinerary",
        capacityLabel: "Capacity",
      },
      styleConfig: {},
    },
    {
      type: "blogPreview",
      variant: "category-grid",
      order: 6,
      enabled: true,
      dataConfig: {
        source: "blogs",
        maxPerCategory: 3,
      },
      contentConfig: {
        sectionEyebrow: "Journal & Insights",
        sectionTitle: "Stories that help travelers choose with confidence.",
        sectionDescription:
          "Use the editorial list when you want blog content to feel more premium, research-led, and destination-guided instead of card-heavy.",
        searchPlaceholder: "Search blogs, destinations, parks, or travel topics...",
        emptyTitle: "No stories match that search",
        emptyDescription: "Try a destination name, travel style, or wildlife topic.",
        groupLabels: {
          safariTitle: "Safari",
          safariAccent: "Articles",
          safariCta: "View More Safari Articles",
          trekkingTitle: "Trekking",
          trekkingAccent: "Articles",
          trekkingCta: "View More Trekking Articles",
          travelTitle: "Travel",
          travelAccent: "Articles",
          travelCta: "View More Travel Articles",
        },
      },
      styleConfig: {},
    },
    {
      type: "destinations",
      variant: "quote-list",
      order: 7,
      enabled: true,
      dataConfig: {
        source: "taxonomy-destinations",
      },
      contentConfig: {
        title: "Our African Safari Destinations",
        subtitle: "Safari / African Safari",
        description:
          "Experience the epitome of Africa's travel, crafted for you. Deluxe safari in Tanzania or beaches in Zanzibar.",
        quote: "Africa's wildlife is... the greatest show on Earth.",
        quoteAuthor: "Attenborough",
      },
      styleConfig: {},
    },
    {
      type: "testimonials",
      variant: "default",
      order: 8,
      enabled: true,
      dataConfig: {},
      contentConfig: {
        backgroundImage:
          "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
        ratingLabel: "EXCELLENT",
        reviewCountLabel: "Based on 30 reviews",
        providerLabel: "Tripadvisor",
        sectionEyebrow: "Guest Reviews",
        sectionTitle: "What travelers remember long after the journey ends.",
        sectionDescription:
          "Switch to the editorial quotes variant when you want testimonials to feel quieter, more premium, and more publication-like.",
        testimonials: [
          {
            name: "Roderick P",
            date: "2025-01-21",
            text: "My family and I had an amazing combination of a safari and a Kilimanjaro trek with MAZ Expeditions. Our safari guide, Laurent, was fantastic...",
          },
          {
            name: "Jane R",
            date: "2025-01-10",
            text: "The safari was absolutely stunning! Every detail was managed perfectly, and the wildlife was breathtaking. I will never forget the Serengeti.",
          },
          {
            name: "William J",
            date: "2025-01-12",
            text: "Our Kilimanjaro trek via the Lemosho Route was beyond incredible! From the moment we arrived, the team made us feel safe and well-prepared...",
          },
        ],
      },
      styleConfig: {},
    },
    {
      type: "cta",
      variant: "trip-cta",
      order: 9,
      enabled: true,
      dataConfig: {},
      contentConfig: {
        heading: "Let's talk about your",
        subheading: "Trip to Africa!",
        description:
          "All our custom itineraries are inspired by our travel experts and positive feedback from past travelers. We're sharing them so you can get a taste of the experience. However, we're flexible and can tailor-make an itinerary just for you. Let us know your preferences, and our safari experts will create a personalized proposal.",
        primaryLabel: "Useful Articles",
        primaryHref: "/blogs",
        secondaryLabel: "Plan My Trip",
        secondaryHref: "/contact",
        accentLabel: "Custom Itineraries",
        backgroundImage:
          "https://images.unsplash.com/photo-1547970810-dc1eac37d174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      },
      styleConfig: {},
    },
    {
      type: "logoCloud",
      variant: "default",
      order: 10,
      enabled: true,
      dataConfig: {},
      contentConfig: {
        title: "",
        backgroundColor: "#ffffff",
        logos: [
          "/assets/images/tanapa.png",
          "/assets/images/tanapalogo.png",
          "/assets/images/ttblogo.png",
          "/assets/images/tatologo.png",
        ],
      },
      styleConfig: {},
    },
  ],
};
