export const isMongoDuplicateKeyError = (error) =>
  error?.code === 11000 || /E11000 duplicate key/i.test(error?.message || "");

export const withDuplicateKeyRetry = async (primaryOperation, fallbackOperation) => {
  try {
    return await primaryOperation();
  } catch (error) {
    if (!isMongoDuplicateKeyError(error) || typeof fallbackOperation !== "function") {
      throw error;
    }

    return fallbackOperation(error);
  }
};
