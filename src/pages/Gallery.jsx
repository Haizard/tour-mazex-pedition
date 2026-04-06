import React from "react";
import { FaExpand, FaMapMarkerAlt, FaImages } from "react-icons/fa";
import { fetchGallery } from "../services/api";
import Testimonial from "../components/Testimonial/Testimonial";
import TripCTA from "../components/Home/TripCTA";
import LogoSlider from "../components/Home/LogoSlider";
import SEO from "../components/UI/SEO";

const normalizeValue = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase();

const GalleryCard = ({ item, onOpen, tall = false }) => (
  <article className="group rounded-3xl overflow-hidden bg-white border border-[#eadfce] shadow-lg hover:shadow-2xl transition-all duration-500">
    <div className={`relative overflow-hidden ${tall ? "h-[300px] md:h-[320px]" : "h-[220px] md:h-[240px]"}`}>
      <img
        src={item.img}
        alt={item.caption || item.location || "Gallery image"}
        className="w-full h-full object-contain bg-gray-50 transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="absolute right-4 top-4 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur hover:bg-[#6f5336] transition-colors"
      >
        <FaExpand />
      </button>
      <div className="absolute left-4 right-4 bottom-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ecd7bc] mb-2 flex items-center gap-2">
          <FaMapMarkerAlt />
          {item.location || "Tanzania"}
        </p>
        <h3 className="text-lg font-black text-white leading-snug line-clamp-2">
          {item.caption || "Untitled Moment"}
        </h3>
      </div>
    </div>
  </article>
);

const Gallery = () => {
  const [items, setItems] = React.useState([]);
  const [activeLocation, setActiveLocation] = React.useState("all");
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadGallery = async () => {
      try {
        setIsLoading(true);
        const response = await fetchGallery();
        const data = Array.isArray(response.data) ? response.data : [];
        setItems(data);
      } catch (error) {
        console.error("Error loading gallery:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGallery();
  }, []);

  const locations = React.useMemo(() => {
    const unique = [
      ...new Set(items.map((item) => item.location?.toString().trim()).filter(Boolean)),
    ];
    return ["all", ...unique];
  }, [items]);

  const filteredItems = React.useMemo(() => {
    if (activeLocation === "all") return items;
    return items.filter(
      (item) => normalizeValue(item.location) === normalizeValue(activeLocation),
    );
  }, [activeLocation, items]);

  const heroImage = filteredItems[0]?.img || items[0]?.img;
  const featuredItems = filteredItems.slice(0, 5);
  const remainingItems = filteredItems.slice(5);

  return (
    <div className="min-h-screen bg-[#f6f1e8] pt-24 pb-20">
      <SEO 
        title="Safari Photo Gallery - Real Tanzania Adventures"
        description="Browse our curated collection of safari photos. Discover majestic wildlife, stunning landscapes, and authentic traveler experiences in Tanzania."
      />
      <section className="relative overflow-hidden text-white min-h-[60vh] md:min-h-[68vh]">
        {heroImage ? (
          <img
            src={heroImage}
            alt="Safari gallery hero"
            className="absolute inset-0 w-full h-full object-contain bg-gray-50"
          />
        ) : (
          <div className="absolute inset-0 bg-[#2f2418]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1b140d]/85 via-[#1b140d]/55 to-[#1b140d]/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_45%)]" />

        <div className="container relative z-10 px-4 py-16 md:py-24">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#e8d0af] mb-4">
            Captured Moments
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95] max-w-5xl">
            Our Safari Gallery
          </h1>
          <p className="mt-6 text-sm md:text-base text-[#efe1cf] max-w-3xl font-medium leading-relaxed">
            A curated visual story from our real adventures in Tanzania.
            Discover wildlife encounters, landscapes, and traveler experiences
            uploaded directly from your gallery database.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur border border-white/25 text-xs font-black uppercase tracking-wider">
              {filteredItems.length} Photos
            </div>
            <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur border border-white/25 text-xs font-black uppercase tracking-wider">
              {locations.length - 1} Locations
            </div>
            <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur border border-white/25 text-xs font-black uppercase tracking-wider inline-flex items-center gap-2">
              <FaImages />
              Curated Collection
            </div>
          </div>
        </div>
      </section>

      <section className="container max-w-6xl mx-auto px-4 mt-10">
        <div className="bg-white border border-[#e7dccb] rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {locations.map((location) => {
              const isActive =
                normalizeValue(activeLocation) === normalizeValue(location);

              return (
                <button
                  key={location}
                  type="button"
                  onClick={() => setActiveLocation(location)}
                  className={`px-4 py-2 rounded-full text-xs md:text-sm font-black uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-[#6f5336] text-white"
                      : "bg-[#f4ede3] text-[#6f5336] hover:bg-[#e8dccd]"
                  }`}
                >
                  {location === "all" ? "All Locations" : location}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="py-28 text-center">
            <p className="text-lg font-bold text-[#6f5336]">Loading gallery...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-28 text-center bg-white border border-dashed border-[#d8c7b4] rounded-3xl mt-8">
            <p className="text-lg font-bold text-[#6f5336]">
              No gallery items found for this location.
            </p>
          </div>
        ) : (
          <>
            {featuredItems.length > 0 && (
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <GalleryCard item={featuredItems[0]} onOpen={setSelectedItem} tall />
                </div>

                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  {featuredItems.slice(1, 3).map((item, index) => (
                    <GalleryCard
                      key={item._id || `${item.img}-${index}`}
                      item={item}
                      onOpen={setSelectedItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {featuredItems.length > 3 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredItems.slice(3).map((item, index) => (
                  <GalleryCard
                    key={item._id || `${item.img}-${index}`}
                    item={item}
                    onOpen={setSelectedItem}
                  />
                ))}
              </div>
            )}

            {remainingItems.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {remainingItems.map((item, index) => (
                  <GalleryCard
                    key={item._id || `${item.img}-${index}`}
                    item={item}
                    onOpen={setSelectedItem}
                    tall={index % 3 === 1}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {selectedItem && (
        <div
          className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm p-4 md:p-10 flex items-center justify-center"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-w-6xl w-full bg-black rounded-3xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 z-20 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-[#6f5336] transition-colors"
            >
              X
            </button>
            <img
              src={selectedItem.img}
              alt={selectedItem.caption || selectedItem.location || "Gallery image"}
              className="w-full max-h-[82vh] object-contain bg-black"
            />
            <div className="p-5 bg-[#1f1710] text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7be9b] mb-2">
                {selectedItem.location || "Tanzania"}
              </p>
              <h4 className="text-xl font-black">
                {selectedItem.caption || "Untitled Moment"}
              </h4>
            </div>
          </div>
        </div>
      )}

      <div className="mt-16">
        <Testimonial />
      </div>

      <div className="mt-12 md:mt-16">
        <TripCTA />
      </div>

      <LogoSlider />
    </div>
  );
};

export default Gallery;
