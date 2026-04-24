import test from "node:test";
import assert from "node:assert/strict";

import {
  attachRequestMetadata,
  buildAllowedOrigins,
  createRateLimit,
  isAllowedOrigin,
} from "../middleware/securityMiddleware.js";

test("isAllowedOrigin accepts configured and vercel preview origins", () => {
  const allowed = buildAllowedOrigins();

  assert.equal(isAllowedOrigin("https://mazexpeditions.vercel.app", allowed), true);
  assert.equal(isAllowedOrigin("https://my-preview-app.vercel.app", allowed), true);
  assert.equal(isAllowedOrigin("https://evil.example.com", allowed), false);
});

test("createRateLimit blocks after max requests within the window", async () => {
  const middleware = createRateLimit({
    windowMs: 60_000,
    max: 2,
    keyGenerator: () => "tenant-auth:test",
  });

  const createResponse = () => ({
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  });

  let nextCount = 0;
  const req = { ip: "127.0.0.1", method: "POST", baseUrl: "/api/auth", path: "/login" };

  await new Promise((resolve) => {
    middleware(req, createResponse(), () => {
      nextCount += 1;
      resolve();
    });
  });

  await new Promise((resolve) => {
    middleware(req, createResponse(), () => {
      nextCount += 1;
      resolve();
    });
  });

  const blockedResponse = createResponse();
  middleware(req, blockedResponse, () => {
    nextCount += 1;
  });

  assert.equal(nextCount, 2);
  assert.equal(blockedResponse.statusCode, 429);
  assert.equal(typeof blockedResponse.body?.retryAfterSeconds, "number");
});

test("attachRequestMetadata sets a reusable request id header", async () => {
  const req = {
    headers: {},
  };
  const res = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };

  await new Promise((resolve) => {
    attachRequestMetadata(req, res, resolve);
  });

  assert.equal(typeof req.requestId, "string");
  assert.equal(req.requestId.length > 5, true);
  assert.equal(res.headers["X-Request-Id"], req.requestId);
});
