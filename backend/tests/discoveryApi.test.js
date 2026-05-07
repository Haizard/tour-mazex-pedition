import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import discoveryRoutes from "../routes/discoveryRoutes.js";
import TourPackage from "../models/TourPackage.js";
import Tenant from "../models/Tenant.js";

const startTestServer = async (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });

const createChain = (rows) => {
  let workingRows = [...rows];

  return {
    sort(sortConfig = {}) {
      const sortKeys = Object.entries(sortConfig);
      if (sortKeys.length) {
        workingRows.sort((left, right) => {
          for (const [key, direction] of sortKeys) {
            const leftValue = left[key];
            const rightValue = right[key];

            if (leftValue === rightValue) {
              continue;
            }

            if (leftValue == null) {
              return 1;
            }

            if (rightValue == null) {
              return -1;
            }

            if (leftValue > rightValue) {
              return direction > 0 ? 1 : -1;
            }

            if (leftValue < rightValue) {
              return direction > 0 ? -1 : 1;
            }
          }

          return 0;
        });
      }

      return this;
    },
    populate() {
      return this;
    },
    skip(amount = 0) {
      workingRows = workingRows.slice(amount);
      return this;
    },
    limit(amount = workingRows.length) {
      workingRows = workingRows.slice(0, amount);
      return this;
    },
    async lean() {
      return workingRows;
    },
  };
};

const applyDiscoveryQuery = (rows, query = {}) =>
  rows.filter((tour) => {
    if (query.isMarketplaceVisible === true && !tour.isMarketplaceVisible) {
      return false;
    }

    if (query.$or?.length) {
      const matchesSearch = query.$or.some((condition) => {
        const [field, rule] = Object.entries(condition)[0];
        const value = tour[field];

        if (Array.isArray(value)) {
          return value.some((item) => rule.$regex.test(String(item)));
        }

        return rule.$regex.test(String(value || ""));
      });

      if (!matchesSearch) {
        return false;
      }
    }

    if (query.location && !query.location.$regex.test(String(tour.location || ""))) {
      return false;
    }

    if (query.category && !query.category.$regex.test(String(tour.category || ""))) {
      return false;
    }

    if (query.duration && !query.duration.$regex.test(String(tour.duration || ""))) {
      return false;
    }

    if (query.price?.$gte != null && Number(tour.price) < Number(query.price.$gte)) {
      return false;
    }

    if (query.price?.$lte != null && Number(tour.price) > Number(query.price.$lte)) {
      return false;
    }

    if (query.tenantId?.$in?.length) {
      const tenantId = tour.tenantId?._id || tour.tenantId;
      return query.tenantId.$in.includes(tenantId);
    }

    return true;
  });

test("Discovery API - B2C Global Marketplace", async (t) => {
  const app = express();
  app.use(express.json());
  app.use("/api/discovery", discoveryRoutes);

  const { server, baseUrl } = await startTestServer(app);
  t.after(() => server.close());

  const originalTourFind = TourPackage.find;
  const originalTourFindOne = TourPackage.findOne;
  const originalTourCount = TourPackage.countDocuments;
  const originalTenantFind = Tenant.find;

  t.afterEach(() => {
    TourPackage.find = originalTourFind;
    TourPackage.findOne = originalTourFindOne;
    TourPackage.countDocuments = originalTourCount;
    Tenant.find = originalTenantFind;
  });

  const mockTours = [
    {
      _id: "tour_hidden",
      title: "Hidden Safari",
      description: "Private launch inventory",
      isMarketplaceVisible: false,
      price: 1000,
      category: "Luxury",
      duration: "4 Days",
      location: "Tanzania",
      featured: false,
      tenantId: { _id: "tenant_hidden", name: "Hidden Operator", slug: "hidden-operator" },
    },
    {
      _id: "tour_global",
      title: "Global Safari",
      description: "Big five through the Serengeti.",
      isMarketplaceVisible: true,
      price: 1500,
      category: "Luxury",
      duration: "6 Days",
      location: "Tanzania",
      featured: true,
      tripAdvisorRating: 4.9,
      tripAdvisorReviewCount: 132,
      tenantId: { _id: "tenant_1", name: "MAZ Partner", slug: "maz-partner" },
      createdAt: "2026-05-01T00:00:00.000Z",
      image: "https://example.com/safari.jpg",
    },
    {
      _id: "tour_trek",
      title: "Affordable Trek",
      description: "Mountain trekking for smaller groups.",
      isMarketplaceVisible: true,
      price: 800,
      category: "Budget",
      duration: "4 Days",
      location: "Tanzania",
      featured: false,
      tripAdvisorRating: 4.5,
      tripAdvisorReviewCount: 48,
      tenantId: { _id: "tenant_2", name: "Budget Peaks", slug: "budget-peaks" },
      createdAt: "2026-04-28T00:00:00.000Z",
      image: "https://example.com/trek.jpg",
    },
  ];

  const installTourMocks = () => {
    TourPackage.find = (query = {}) => createChain(applyDiscoveryQuery(mockTours, query));
    TourPackage.countDocuments = async (query = {}) => applyDiscoveryQuery(mockTours, query).length;
  };

  await t.test("should only return tours where isMarketplaceVisible is true", async () => {
    installTourMocks();

    const res = await fetch(`${baseUrl}/api/discovery/tours`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.tours.length, 2);
    assert.equal(body.tours[0].title, "Global Safari");
    assert.equal(body.pagination.total, 2);
  });

  await t.test("should support category, operator, duration, and sort filters", async () => {
    installTourMocks();
    Tenant.find = (query = {}) => ({
      select: () => ({
        lean: async () =>
          [
            { _id: "tenant_1", name: "MAZ Partner", slug: "maz-partner" },
            { _id: "tenant_2", name: "Budget Peaks", slug: "budget-peaks" },
          ].filter((tenant) => query.$or?.some((condition) => condition.slug?.$regex?.test(tenant.slug))),
      }),
    });

    const res = await fetch(
      `${baseUrl}/api/discovery/tours?category=Budget&operator=budget-peaks&duration=4&sort=price-asc`
    );
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.tours.length, 1);
    assert.equal(body.tours[0].title, "Affordable Trek");
    assert.equal(body.tours[0].operator.slug, "budget-peaks");
  });

  await t.test("should return marketplace card fields for operator and review context", async () => {
    installTourMocks();

    const res = await fetch(`${baseUrl}/api/discovery/tours`);
    const body = await res.json();
    const firstTour = body.tours[0];

    assert.equal(res.status, 200);
    assert.deepEqual(firstTour.operator, {
      id: "tenant_1",
      name: "MAZ Partner",
      slug: "maz-partner",
    });
    assert.equal(firstTour.tripAdvisorRating, 4.9);
    assert.equal(firstTour.tripAdvisorReviewCount, 132);
    assert.equal(firstTour.featured, true);
  });

  await t.test("should reject tours that are not marketplace visible in detail view", async () => {
    TourPackage.findOne = (query = {}) => ({
      populate: () => ({
        lean: async () =>
          mockTours.find(
            (tour) =>
              String(tour._id) === String(query._id) &&
              tour.isMarketplaceVisible === query.isMarketplaceVisible
          ) || null,
      }),
    });

    const res = await fetch(`${baseUrl}/api/discovery/tours/tour_hidden`);
    const body = await res.json();

    assert.equal(res.status, 404);
    assert.equal(body.message, "Tour not found in marketplace.");
  });

  await t.test("should return active operators from the network", async () => {
    Tenant.find = () => ({
      select: () => ({
        lean: async () => [
          { _id: "tenant_1", name: "MAZ Partner", slug: "maz-partner" },
          { _id: "tenant_2", name: "Budget Peaks", slug: "budget-peaks" },
        ],
      }),
    });

    const res = await fetch(`${baseUrl}/api/discovery/operators`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.length, 2);
    assert.equal(body[0].name, "MAZ Partner");
  });
});
