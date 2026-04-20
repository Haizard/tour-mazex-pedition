import React, { useState, useEffect } from "react";
import PackageCard from "./PackageCard";
import FilterSidebar from "./FilterSidebar";
import { fetchTours, fetchTaxonomies } from "../../services/api";
import { useSearchParams } from "react-router-dom";
import { FaFilter, FaSearch, FaTimes } from "react-icons/fa";
import { useRouteData } from "../../utils/routeData.jsx";

const uniqueSorted = (values = []) =>
  [...new Set(values.map((value) => (value || "").toString().trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );

const normalizeFilterValue = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const PackagesComp = () => {
  const routeData = useRouteData();
  const sharedData = routeData.shared || {};
  const initialTours = Array.isArray(sharedData.tours) ? sharedData.tours : [];
  const initialTaxonomyCategories = Array.isArray(sharedData.taxonomies?.categories)
    ? sharedData.taxonomies.categories.map((item) => item.name).filter(Boolean)
    : [];
  const initialTaxonomyTypes = Array.isArray(sharedData.taxonomies?.tourTypes)
    ? sharedData.taxonomies.tourTypes.map((item) => item.name).filter(Boolean)
    : [];
  const [allTours, setAllTours] = useState(initialTours);
  const [filteredTours, setFilteredTours] = useState(initialTours);
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const typeFromUrl = searchParams.get("type") || "";

  const [categories, setCategories] = useState(
    uniqueSorted(
      initialTours.length
        ? initialTours.map((tour) => tour.category)
        : initialTaxonomyCategories,
    ),
  );
  const [tourTypes, setTourTypes] = useState(
    uniqueSorted(
      initialTours.length
        ? initialTours.map((tour) => tour.tourType)
        : initialTaxonomyTypes,
    ),
  );
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [filters, setFilters] = useState({
    category: "",
    tourType: typeFromUrl,
    maxPrice: 10000,
  });

  useEffect(() => {
    setAllTours(initialTours);
  }, [sharedData.tours]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [toursResult, catResult, typeResult] = await Promise.allSettled([
          fetchTours(),
          fetchTaxonomies("tourCategory"),
          fetchTaxonomies("tourType"),
        ]);

        const toursData =
          toursResult.status === "fulfilled" && Array.isArray(toursResult.value.data)
            ? toursResult.value.data
            : [];
        setAllTours(toursData);

        const taxonomyCategories =
          catResult.status === "fulfilled" && Array.isArray(catResult.value.data)
            ? catResult.value.data.map((c) => c.name).filter(Boolean)
            : [];
        const taxonomyTypes =
          typeResult.status === "fulfilled" && Array.isArray(typeResult.value.data)
            ? typeResult.value.data.map((t) => t.name).filter(Boolean)
            : [];

        const tourFallbackCategories = uniqueSorted(toursData.map((tour) => tour.category));
        const tourFallbackTypes = uniqueSorted(toursData.map((tour) => tour.tourType));

        // Prefer real values from tours so selecting filters always maps to real data.
        // Fall back to taxonomy values only if tours do not provide them.
        setCategories(
          uniqueSorted(
            tourFallbackCategories.length ? tourFallbackCategories : taxonomyCategories,
          ),
        );
        setTourTypes(
          uniqueSorted(tourFallbackTypes.length ? tourFallbackTypes : taxonomyTypes),
        );
      } catch (error) {
        console.error("Error loading packages data:", error);
      }
    };
    loadInitialData();
  }, []);

  // Sync filters with URL params (e.g. if type is null, reset to show ALL tours)
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      tourType: typeFromUrl || "",
      category: searchParams.get("category") || ""
    }));
  }, [typeFromUrl, searchParams]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    let result = [...allTours];

    const query = (searchInput || search).trim().toLowerCase();

    if (query) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.location.toLowerCase().includes(query) ||
          (t.description || "").toLowerCase().includes(query) ||
          (t.tourType || "").toLowerCase().includes(query) ||
          (t.category || "").toLowerCase().includes(query),
      );
    }

    // Sidebar Filters (Normalization for case/whitespace)
    if (filters.category) {
      const selectedCategory = normalizeFilterValue(filters.category);
      result = result.filter(
        (t) => normalizeFilterValue(t.category) === selectedCategory,
      );
    }
    if (filters.tourType) {
      const selectedTourType = normalizeFilterValue(filters.tourType);
      result = result.filter(
        (t) => normalizeFilterValue(t.tourType) === selectedTourType,
      );
    }
    if (filters.maxPrice) {
      result = result.filter((t) => t.price <= filters.maxPrice);
    }

    setFilteredTours(result);
  }, [allTours, filters, search, searchInput]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container py-12 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="border-l-8 border-primary py-2 pl-4 text-4xl font-black uppercase tracking-tighter text-secondary">
              {filters.tourType
                ? `${filters.tourType} Adventures`
                : "Discover Our Tours"}
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

        <div className="mb-8 rounded-[28px] border border-gray-100 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search tours, destinations, styles, or keywords..."
                className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400"
              />
            </div>
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="rounded-2xl bg-secondary px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:opacity-90"
              >
                Clear Search
              </button>
            )}
          </div>
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
