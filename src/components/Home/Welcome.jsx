import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import KiliImg from "../../assets/Kilimanjaro.jpg";
import SafariImg from "../../assets/momentlion.jpg";
import AboutImg from "../../assets/camp1.jpg";
import FamilyImg from "../../assets/tembo.jpg";

const defaultCards = [
  {
    title: "Explore Our Kilimanjaro Packages",
    description:
      "Conquer Africa's highest peak with our Kilimanjaro trekking packages. Whether you're a seasoned climber or a beginner, our expert guides ensure a safe, unforgettable journey to the summit. Choose your route and start your adventure today.",
    image: KiliImg,
    alt: "Kilimanjaro Trekking",
    href: "/packages?type=Trekking",
    reverse: false,
    scriptLabel: "",
  },
  {
    title: "Explore Our Safari Packages",
    description:
      "Join us on an unforgettable safari adventure. Discover Africa's wildlife and stunning landscapes, from the Serengeti to the Ngorongoro Crater. Our tailored safari packages promise an experience you'll never forget.",
    image: SafariImg,
    alt: "Safari Adventures",
    href: "/packages?type=Safari",
    reverse: true,
    scriptLabel: "",
  },
  {
    title: "Experience, Expertise, and Research",
    description:
      "Born from a passion for travel and shaped by deep local experience, MAZ Expeditions creates meaningful African journeys with a strong focus on authenticity, care, and unforgettable memories for every traveler.",
    image: AboutImg,
    alt: "About Us",
    href: "/about",
    reverse: false,
    scriptLabel: "About us",
  },
  {
    title: "Best African safari with kids",
    description: "",
    image: FamilyImg,
    alt: "Family Safaris",
    href: "/packages?category=Family Friendly",
    reverse: true,
    scriptLabel: "Family Safaris",
  },
];

const Welcome = ({
  introLabel = "Welcome to",
  brandName = "MAZ Expeditions",
  leadHeading = "Experience the transformative power of travel with MAZ Expeditions, a journey that enriches your soul while fostering the preservation of Africa's vibrant communities, pristine environments, and majestic wildlife.",
  bodyText = "MAZ Expeditions is a locally rooted African safari company built around thoughtful planning, personal service, and tailor-made adventures. We shape each itinerary around your interests, carefully choosing the places, pace, and experiences that fit you best. On your private journey, we create a close, memorable experience led by knowledgeable local professionals who know these landscapes deeply. Traveling with MAZ Expeditions means exploring Tanzania with a team that values authenticity, safety, and lasting impact for both travelers and the communities connected to each journey.",
  closingHeading = "Experience the unmatched luxury of Africa's wilderness with MAZ Expeditions.",
  cards = defaultCards,
}) => {
  const mergedCards = defaultCards.map((card, index) => ({
    ...card,
    ...(cards?.[index] || {}),
  }));

  return (
    <div className="bg-white py-12 md:py-24">
      <div className="container px-4 max-w-5xl mx-auto text-center mb-12 md:mb-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-5xl lg:text-6xl font-heading mb-4 md:mb-6 text-gray-900 tracking-tight"
        >
          <i className="italic font-light text-gray-600">{introLabel} </i>
          <br className="md:hidden" />
          <span className="font-oswald font-extrabold uppercase ml-0 md:ml-2 text-safari-green leading-snug">
            {brandName}
          </span>
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-3xl font-heading text-gray-800 mb-6 md:mb-8 max-w-4xl mx-auto leading-relaxed"
        >
          {leadHeading}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-sm md:text-lg text-gray-600 font-sans leading-relaxed md:leading-loose max-w-4xl mx-auto text-left md:text-center mb-8 md:mb-16"
        >
          {bodyText}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-2xl md:text-4xl font-heading text-gray-900 max-w-4xl mx-auto leading-tight"
        >
          {closingHeading}
        </motion.h2>
      </div>

      <div className="container px-4">
        <div className="flex flex-col gap-8 md:gap-16 max-w-6xl mx-auto">
          {mergedCards.map((card, index) => (
            <motion.div
              key={`${card.title}-${index}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="flex flex-col group cursor-pointer"
            >
              <Link
                to={card.href}
                className={`flex w-full bg-surface hover:bg-white transition-colors duration-500 rounded-[20px] md:rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl ${
                  card.reverse ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div className="flex-1 flex flex-col justify-center w-1/2 p-3 sm:p-6 md:p-12 lg:p-16">
                  {card.scriptLabel ? (
                    <h2 className="font-signature text-3xl sm:text-4xl md:text-6xl text-safari-green mb-1 sm:mb-2 md:mb-4 transition-colors">
                      {card.scriptLabel}
                    </h2>
                  ) : null}
                  <h3 className="text-sm sm:text-base md:text-3xl lg:text-5xl font-heading font-semibold text-gray-900 mb-2 md:mb-6 transition-colors group-hover:text-safari-green leading-tight">
                    {card.title}
                  </h3>
                  {card.description ? (
                    <p className="text-[10px] sm:text-xs md:text-lg text-gray-600 font-sans leading-relaxed line-clamp-4 md:line-clamp-none">
                      {card.description}
                    </p>
                  ) : null}
                </div>
                <div className="w-1/2 relative min-h-[160px] sm:min-h-[200px] md:min-h-full">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10" />
                  <img
                    src={card.image}
                    alt={card.alt}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Welcome;
