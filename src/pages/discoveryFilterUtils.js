export const countActiveDiscoveryFilters = (filters = {}) =>
  Object.entries(filters).reduce((count, [key, value]) => {
    if (key === "sort") {
      return count;
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? count + 1 : count;
    }

    return value ? count + 1 : count;
  }, 0);
