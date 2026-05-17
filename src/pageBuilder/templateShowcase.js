const normalize = (value = "") => String(value).trim().toLowerCase();

const isPurchased = (template) =>
  ["purchased", "included"].includes(template?.purchaseStatus);

export const getShowcaseFilters = (templates = []) => {
  const categories = templates
    .map((template) => template.category)
    .filter(Boolean);

  return ["All", "Purchased", ...Array.from(new Set(categories))];
};

export const resolveShowcaseTemplates = (templates = [], options = {}) => {
  const query = normalize(options.query);
  const filter = options.filter || "All";
  const sort = options.sort || "Recent";

  return templates
    .filter((template) => {
      if (filter === "Purchased") return isPurchased(template);
      if (filter !== "All") return template.category === filter;
      return true;
    })
    .filter((template) => {
      if (!query) return true;
      const searchable = [
        template.name,
        template.category,
        template.preview,
        ...(template.bestFor || []),
      ]
        .map(normalize)
        .join(" ");

      return searchable.includes(query);
    })
    .sort((a, b) => {
      if (sort === "Popular") {
        return (b.featuredRank || 0) - (a.featuredRank || 0);
      }

      return (b.releaseOrder || 0) - (a.releaseOrder || 0);
    });
};
