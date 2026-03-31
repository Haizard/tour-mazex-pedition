import React from "react";
import { FaExpand, FaMapMarkerAlt } from "react-icons/fa";
import { fetchGallery } from "../services/api";

const normalizeValue = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase();

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
      ...new Set(
        items.map((item) => item.location?.toString().trim()).filter(Boolean),
      ),
    ];
    return ["all", ...unique];
  }, [items]);

  const filteredItems = React.useMemo(() => {
    if (activeLocation === "all") return items;
    return items.filter(
      (item) => normalizeValue(item.location) === normalizeValue(activeLocation),
    );
  }, [activeLocation, items]);

  return (
    <div className="min-h-screen bg-[#f6f1e8] pt-24 pb-20">
      <section className="relative overflow-hidden bg-[#2f2418] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_55%)]" />
        <div className="container relative z-10 px-4 py-14 md:py-20">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d7be9b] mb-4">
            Captured Moments
          </p>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none max-w-4xl">
            Safari Gallery
          </h1>
          <p className="mt-5 text-sm md:text-base text-[#eadcc8] max-w-3xl font-medium leading-relaxed">
            Explore real moments from our travelers across Tanzania. This page is
            connected directly to your gallery data in MongoDB.
          </p>
        </div>
      </section>

      <section className="container px-4 mt-10">
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
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6 mt-8 [column-fill:_balance]">
            {filteredItems.map((item, index) => (
              <article
                key={item._id || `${item.img}-${index}`}
                className="mb-6 break-inside-avoid rounded-3xl overflow-hidden bg-white shadow-lg border border-[#eadfce] group"
              >
                <div className="relative">
                  <img
                    src={item.img}
                    alt={item.caption || item.location || "Gallery image"}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="absolute right-4 top-4 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur hover:bg-[#6f5336] transition-colors"
                  >
                    <FaExpand />
                  </button>
                </div>

                <div className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a38c72] mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt />
                    {item.location || "Tanzania"}
                  </p>
                  <h3 className="text-lg font-black text-[#2f2418] leading-snug">
                    {item.caption || "Untitled Moment"}
                  </h3>
                </div>
              </article>
            ))}
          </div>
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
              ×
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
    </div>
  );
};

export default Gallery;

