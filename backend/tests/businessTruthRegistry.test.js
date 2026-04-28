import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBusinessTruthCutoverPlan,
  getBusinessTruthEntity,
  listBusinessTruthEntities,
  summarizeInfrastructureTargets,
} from "../utils/businessTruthRegistry.js";

test("listBusinessTruthEntities returns entities in safe cutover order", () => {
  const entities = listBusinessTruthEntities();

  assert.equal(entities[0].key, "bookings");
  assert.equal(entities[1].key, "payments");
  assert.equal(entities.at(-1)?.key, "partner-contracts-and-attribution");
});

test("business truth entities declare current and target owners", () => {
  const payments = getBusinessTruthEntity("payments");

  assert.equal(payments?.currentOwner, "mongodb");
  assert.equal(payments?.targetOwner, "postgresql");
  assert.equal(payments?.migrationMode, "shadow-prep");
});

test("summarizeInfrastructureTargets exposes service responsibilities", () => {
  const services = summarizeInfrastructureTargets();
  const redis = services.find((service) => service.key === "redis");

  assert.equal(Boolean(redis), true);
  assert.equal(redis.role.includes("locks"), true);
});

test("buildBusinessTruthCutoverPlan groups entities by wave", () => {
  const plan = buildBusinessTruthCutoverPlan();

  assert.equal(plan[0].wave, 1);
  assert.equal(plan[0].entities[0].key, "bookings");
  assert.equal(plan[1].entities.some((entity) => entity.key === "quotes"), true);
});
