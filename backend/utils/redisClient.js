import { createClient } from "redis";

const parseRedisUrl = (value = "") => {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("redis://") ? trimmed : `redis://${trimmed}`;
};

export const getRedisRuntimeConfig = (env = globalThis.process?.env || {}) => {
  const redisUrl = parseRedisUrl(env.REDIS_URL);
  const host = String(env.REDIS_HOST || "").trim();
  const port = Number(env.REDIS_PORT || 0);
  const username = String(env.REDIS_USERNAME || "default").trim();
  const password = String(env.REDIS_PASSWORD || "").trim();
  const dbName = String(env.REDIS_DB_NAME || "").trim();

  return {
    redisUrl,
    host,
    port,
    username,
    password,
    dbName,
    configured: Boolean(redisUrl || (host && port)),
    authReady: Boolean(password),
  };
};

export const createRedisConnectionOptions = (env = globalThis.process?.env || {}) => {
  const config = getRedisRuntimeConfig(env);

  if (config.redisUrl) {
    return {
      url: config.redisUrl,
      username: config.username || undefined,
      password: config.password || undefined,
    };
  }

  if (config.host && config.port) {
    return {
      username: config.username || undefined,
      socket: {
        host: config.host,
        port: config.port,
      },
      password: config.password || undefined,
    };
  }

  return null;
};

let redisClientPromise = null;

export const getRedisClient = async (env = globalThis.process?.env || {}) => {
  const options = createRedisConnectionOptions(env);

  if (!options) {
    return null;
  }

  if (!redisClientPromise) {
    const client = createClient(options);

    client.on("error", (error) => {
      console.error("Redis connection error:", error.message);
    });

    redisClientPromise = client.connect().then(() => client).catch((error) => {
      redisClientPromise = null;
      throw error;
    });
  }

  return redisClientPromise;
};

export const closeRedisClient = async () => {
  if (!redisClientPromise) {
    return;
  }

  const client = await redisClientPromise;
  await client.quit();
  redisClientPromise = null;
};
