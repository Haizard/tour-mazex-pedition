import test from "node:test";
import assert from "node:assert/strict";

import { buildInfrastructureReadinessReport } from "../utils/infrastructureHealth.js";

test("buildInfrastructureReadinessReport includes mongo health and service readiness", async () => {
  const report = await buildInfrastructureReadinessReport({
    env: {
      MONGODB_URI: "mongodb://example",
      POSTGRES_URL: "postgres://example",
      REDIS_URL: "",
      MEDIA_STORAGE_PROVIDER: "mongo-inline",
    },
    mongoHealth: {
      readyState: 1,
      connected: true,
      pingOk: true,
      legacyFoundationReady: true,
    },
  });

  assert.equal(report.activeBusinessStore, "mongodb");
  assert.equal(report.services.find((service) => service.key === "mongodb")?.connected, true);
  assert.equal(report.services.find((service) => service.key === "postgresql")?.configured, true);
});

test("buildInfrastructureReadinessReport marks s3 as configured when the object-storage strategy is ready", async () => {
  const report = await buildInfrastructureReadinessReport({
    env: {
      MONGODB_URI: "mongodb://example",
      MEDIA_STORAGE_PROVIDER: "s3-compatible",
      S3_BUCKET: "mazex-media",
      S3_ENDPOINT: "https://s3.example.com",
      S3_PUBLIC_BASE_URL: "https://cdn.example.com",
    },
    mongoHealth: {
      readyState: 1,
      connected: true,
      pingOk: true,
      legacyFoundationReady: true,
    },
  });

  const s3 = report.services.find((service) => service.key === "s3");
  assert.equal(s3?.configured, true);
  assert.equal(report.objectStorage.activeProvider, "s3-compatible");
});

test("buildInfrastructureReadinessReport keeps redis unconfigured until auth is present", async () => {
  const report = await buildInfrastructureReadinessReport({
    env: {
      MONGODB_URI: "mongodb://example",
      REDIS_HOST: "redis.example.com",
      REDIS_PORT: "6379",
      REDIS_PASSWORD: "",
    },
    mongoHealth: {
      readyState: 1,
      connected: true,
      pingOk: true,
      legacyFoundationReady: true,
    },
  });

  const redis = report.services.find((service) => service.key === "redis");
  assert.equal(redis?.configured, false);
  assert.equal(redis?.notes[0].includes("password"), true);
});
