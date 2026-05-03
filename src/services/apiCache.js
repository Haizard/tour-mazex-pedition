export const createGetRequestCache = ({
  ttlMs = 8000,
  now = () => Date.now(),
} = {}) => {
  const cache = new Map();
  const inFlight = new Map();

  const clear = () => {
    cache.clear();
    inFlight.clear();
  };

  const get = (key, requestFactory, options = {}) => {
    if (options.cache === false) {
      return requestFactory();
    }

    const cached = cache.get(key);
    if (cached && cached.expiresAt > now()) {
      return Promise.resolve(cached.response);
    }

    if (inFlight.has(key)) {
      return inFlight.get(key);
    }

    const request = Promise.resolve()
      .then(requestFactory)
      .then((response) => {
        cache.set(key, {
          response,
          expiresAt: now() + ttlMs,
        });
        return response;
      })
      .finally(() => {
        inFlight.delete(key);
      });

    inFlight.set(key, request);
    return request;
  };

  return {
    clear,
    get,
    size: () => cache.size + inFlight.size,
  };
};
