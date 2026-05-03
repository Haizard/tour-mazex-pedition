export const safePrimaryLookup = async (lookup, { onError } = {}) => {
  try {
    return await lookup();
  } catch (error) {
    if (typeof onError === "function") {
      onError(error);
    }

    return null;
  }
};
