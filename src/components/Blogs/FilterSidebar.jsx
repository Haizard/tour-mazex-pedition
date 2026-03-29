import React from "react";

const FilterSidebar = ({ filters, setFilters, categories, tourTypes }) => {
  const handleCategoryChange = (cat) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === cat ? "" : cat,
    }));
  };

  const handleTypeChange = (type) => {
    setFilters((prev) => ({
      ...prev,
      tourType: prev.tourType === type ? "" : type,
    }));
  };

  const handlePriceChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      maxPrice: e.target.value,
    }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-8 sticky top-24 h-fit">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase tracking-tighter text-secondary flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          Filters
        </h2>
        <button
          onClick={() =>
            setFilters({ category: "", tourType: "", maxPrice: 10000 })
          }
          className="text-xs font-bold text-primary hover:underline"
        >
          Reset All
        </button>
      </div>

      {/* Tour Type */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
          Adventure Type
        </h3>
        <div className="flex flex-col gap-2">
          {tourTypes.map((type) => (
            <label
              key={type}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.tourType === type}
                onChange={() => handleTypeChange(type)}
                className="w-5 h-5 border-2 border-gray-200 rounded text-primary focus:ring-primary transition-all cursor-pointer"
              />
              <span
                className={`font-bold transition-colors ${filters.tourType === type ? "text-primary" : "text-gray-600 group-hover:text-secondary"}`}
              >
                {type}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
          Style
        </h3>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <label
              key={cat}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.category === cat}
                onChange={() => handleCategoryChange(cat)}
                className="w-5 h-5 border-2 border-gray-200 rounded text-primary focus:ring-primary transition-all cursor-pointer"
              />
              <span
                className={`font-bold transition-colors ${filters.category === cat ? "text-primary" : "text-gray-600 group-hover:text-secondary"}`}
              >
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
            Budget
          </h3>
          <span className="text-primary font-black text-lg">
            ${filters.maxPrice}
          </span>
        </div>
        <input
          type="range"
          min="100"
          max="10000"
          step="500"
          value={filters.maxPrice}
          onChange={handlePriceChange}
          className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 uppercase">
          <span>$100</span>
          <span>$10,000</span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 font-medium leading-tight">
          * Prices are approximate and per person. Use the chat bot for a custom
          quote! 🦁
        </p>
      </div>
    </div>
  );
};

export default FilterSidebar;
