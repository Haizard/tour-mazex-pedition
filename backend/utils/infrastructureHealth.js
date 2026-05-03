import { getDatabaseHealth } from "./database.js";
import { getPostgresHealth, isPostgresConfigured } from "./postgresClient.js";
import { getRedisRuntimeConfig } from "./redisClient.js";
import {
  buildBusinessTruthCutoverPlan,
  listBusinessTruthEntities,
  summarizeInfrastructureTargets,
} from "./businessTruthRegistry.js";
import { getObjectStorageStrategy } from "./objectStorage.js";

const hasConfiguredDatabaseUrl = (...values) =>
  values.some((value) => {
    const text = String(value || "").trim();
    return Boolean(text) && !text.includes("[YOUR-PASSWORD]") && !text.includes("<replace-with-password>");
  });

const buildConfiguredStatus = ({
  key,
  label,
  mode,
  configured,
  envKeys = [],
  notes = [],
  currentOwner = false,
  targetOwner = true,
  health = {},
} = {}) => ({
  key,
  label,
  mode,
  configured,
  currentOwner,
  targetOwner,
  envKeys,
  notes,
  ...health,
});

export const buildInfrastructureReadinessReport = async ({
  env = globalThis.process?.env || {},
  mongoHealth = null,
} = {}) => {
  const currentMongoHealth = mongoHealth || (await getDatabaseHealth());
  const postgresHealth = await getPostgresHealth(env);
  const objectStorageStrategy = getObjectStorageStrategy(env);
  const redisConfig = getRedisRuntimeConfig(env);
  const targetServices = summarizeInfrastructureTargets();

  const services = [
    buildConfiguredStatus({
      key: "mongodb",
      label: "MongoDB",
      mode: "active",
      configured: Boolean(env.MONGODB_URI),
      currentOwner: true,
      targetOwner: false,
      envKeys: ["MONGODB_URI"],
      health: {
        connected: currentMongoHealth.connected,
        pingOk: currentMongoHealth.pingOk,
        readyState: currentMongoHealth.readyState,
      },
      notes: [
        currentMongoHealth.legacyFoundationReady
          ? "Legacy tenant foundation is ready."
          : "Legacy tenant foundation is not ready yet.",
      ],
    }),
    buildConfiguredStatus({
      key: "postgresql",
      label: "PostgreSQL",
      mode: "shadow-prep",
      configured: isPostgresConfigured(env),
      envKeys: ["POSTGRES_URL", "DATABASE_URL", "SUPABASE_DB_URL"],
      health: {
        connected: postgresHealth.connected,
        pingOk: postgresHealth.pingOk,
        databaseName: postgresHealth.databaseName || "",
      },
      notes: [
        postgresHealth.errorMessage
          ? `Connection check failed: ${postgresHealth.errorMessage}`
          : "Target owner for bookings, payments, quotes, and operational schedules.",
      ],
    }),
    buildConfiguredStatus({
      key: "redis",
      label: "Redis",
      mode: "planned",
      configured: Boolean(redisConfig.configured && redisConfig.authReady),
      envKeys: ["REDIS_URL", "REDIS_HOST", "REDIS_PORT", "REDIS_USERNAME", "REDIS_PASSWORD"],
      notes: [
        redisConfig.configured && !redisConfig.authReady
          ? "Redis host is present, but a password is still required before the runtime can connect safely."
          : "Reserved for retries, locks, queues, webhook deduplication, and scheduling.",
      ],
    }),
    buildConfiguredStatus({
      key: "pgvector",
      label: "pgvector",
      mode: "planned",
      configured: hasConfiguredDatabaseUrl(
        env.PGVECTOR_URL,
        env.POSTGRES_URL,
        env.DATABASE_URL,
        env.SUPABASE_DB_URL
      ) && postgresHealth.connected,
      envKeys: ["PGVECTOR_URL", "POSTGRES_URL", "DATABASE_URL", "SUPABASE_DB_URL"],
      notes: [
        "Planned semantic retrieval layer for AI and traveler memory use cases.",
      ],
    }),
    buildConfiguredStatus({
      key: "s3",
      label: "S3-Compatible Storage",
      mode: objectStorageStrategy.activeProvider === "s3-compatible" ? "active" : "shadow-prep",
      configured: objectStorageStrategy.activeProvider === "s3-compatible",
      envKeys: ["MEDIA_STORAGE_PROVIDER", "S3_BUCKET", "S3_ENDPOINT", "S3_PUBLIC_BASE_URL"],
      notes: objectStorageStrategy.reasons,
    }),
  ];

  return {
    generatedAt: new Date().toISOString(),
    activeBusinessStore: "mongodb",
    targetBusinessStore: "postgresql",
    shadowMigrationEnabled: services.some((service) => service.key === "postgresql" && service.configured),
    targetServices,
    services,
    objectStorage: objectStorageStrategy,
    entities: listBusinessTruthEntities(),
    cutoverPlan: buildBusinessTruthCutoverPlan(),
  };
};
