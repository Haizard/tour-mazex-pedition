import React, { useState, useEffect } from "react";
import PackageCard from "./PackageCard";
import FilterSidebar from "./FilterSidebar";
import { fetchTours, fetchTaxonomies } from "../../services/api";
import { useSearchParams } from "react-router-dom";
import { FaFilter, FaTimes } from "react-icons/fa";

const PackagesComp = () => {
  const [allTours, setAllTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const typeFromUrl = searchParams.get("type") || "";

  const [categories, setCategories] = useState([]);
  const [tourTypes, setTourTypes] = useState([]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    tourType: typeFromUrl,
    maxPrice: 10000,
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [toursRes, catRes, typeRes] = await Promise.all([
          fetchTours(),
          fetchTaxonomies("tourCategory"),
          fetchTaxonomies("tourType"),
        ]);
        setAllTours(toursRes.data);
        setCategories(catRes.data.map((c) => c.name));
        setTourTypes(typeRes.data.map((t) => t.name));
      } catch (error) {
        console.error("Error loading packages data:", error);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    let result = [...allTours];

    // Search from URL
    if (search) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.location.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Sidebar Filters (Normalization for case/whitespace)
    if (filters.category) {
      result = result.filter(
        (t) =>
          t.category?.trim().toLowerCase() ===
          filters.category.trim().toLowerCase(),
      );
    }
    if (filters.tourType) {
      result = result.filter(
        (t) =>
          t.tourType?.trim().toLowerCase() ===
          filters.tourType.trim().toLowerCase(),
      );
    }
    if (filters.maxPrice) {
      result = result.filter((t) => t.price <= filters.maxPrice);
    }

    setFilteredTours(result);
  }, [allTours, filters, search]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container py-12 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="border-l-8 border-primary py-2 pl-4 text-4xl font-black uppercase tracking-tighter text-secondary">
              {filters.tourType
                ? `${filters.tourType} Adventures`
                : "Discover Our Packages"}
            </h1>
            <p className="text-gray-500 font-bold mt-2 ml-4 uppercase tracking-widest text-xs">
              Showing {filteredTours.length} results
            </p>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilter(true)}
            className="md:hidden flex items-center justify-center gap-2 bg-secondary text-white py-4 rounded-xl font-bold shadow-xl active:scale-95 transition-all"
          >
            <FaFilter /> Filter Packages
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-full md:w-1/4">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              categories={categories}
              tourTypes={tourTypes}
            />
          </aside>

          {/* Main Grid */}
          <main className="w-full md:w-3/4">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredTours.length > 0 ? (
                filteredTours.map((item) => (
                  <PackageCard key={item._id} {...item} />
                ))
              ) : (
                <div className="col-span-full py-32 text-center bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                  <div className="text-6xl mb-4">🔦</div>
                  <h3 className="text-xl font-black text-secondary uppercase tracking-tighter">
                    No Adventures Found
                  </h3>
                  <p className="text-gray-400 font-bold mt-2 px-10">
                    Try adjusting your filters or search terms to find your
                    perfect trip.
                  </p>
                  <button
                    onClick={() =>
                      setFilters({
                        category: "",
                        tourType: "",
                        maxPrice: 10000,
                      })
                    }
                    className="mt-6 text-primary font-black hover:underline uppercase text-sm"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm md:hidden">
          <div className="absolute right-0 top-0 bottom-0 w-[85%] bg-white p-6 shadow-2xl flex flex-col animate-slide-left">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-secondary">
                Filters
              </h2>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-secondary"
              >
                <FaTimes />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 pb-20">
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                categories={categories}
                tourTypes={tourTypes}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
              <button
                onClick={() => setShowMobileFilter(false)}
                className="w-full bg-primary text-secondary py-4 rounded-xl font-bold uppercase tracking-tighter shadow-lg shadow-primary/30"
              >
                Show {filteredTours.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesComp;
