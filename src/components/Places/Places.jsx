import React from "react";
import PlaceCard from "./PlaceCard";
import { fetchGallery } from "../../services/api";

const Places = ({ handleOrderPopup }) => {
  const [galleryData, setGalleryData] = React.useState([]);

  React.useEffect(() => {
    const getPlaces = async () => {
      try {
        const response = await fetchGallery();
        setGalleryData(response.data);
      } catch (error) {
        console.error("Error fetching gallery:", error);
      }
    };
    getPlaces();
  }, []);

  return (
    <div className="bg-stone-300 py-24">
      <section className="container">
        <div className="mb-16">
          <p className="text-primary font-bold uppercase tracking-widest mb-3 text-sm">
            Visual Journeys
          </p>
          <h2 className="text-4xl md:text-5xl font-black font-heading text-slate-900">
            Our Adventure Gallery
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryData.length > 0 ? (
            galleryData.map((item, index) => (
              <PlaceCard
                key={item._id || index}
                img={item.img}
                location={item.location}
                title={item.caption}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-gray-400 font-bold uppercase tracking-widest italic font-heading text-xl">
                Capturing the world's beauty...
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Places;
