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
    { _id: "tour_hidden", title: "Hidden Safari", isMarketplaceVisible: false, price: 1000 },
    { _id: "tour_global", title: "Global Safari", isMarketplaceVisible: true, price: 1500, tenantId: { name: "MAZ Partner" } },
    { _id: "tour_trek", title: "Affordable Trek", isMarketplaceVisible: true, price: 800, tenantId: { name: "Budget Peaks" } },
  ];

  await t.test("should only return tours where isMarketplaceVisible is true", async () => {
    TourPackage.find = () => ({
      populate: () => ({
        skip: () => ({
          limit: () => ({
            lean: async () => mockTours.filter((tour) => tour.isMarketplaceVisible),
          }),
        }),
      }),
    });

    TourPackage.countDocuments = async () =>
      mockTours.filter((tour) => tour.isMarketplaceVisible).length;

    const res = await fetch(`${baseUrl}/api/discovery/tours`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.tours.length, 2);
    assert.equal(body.tours[0].title, "Global Safari");
    assert.equal(body.pagination.total, 2);
  });

  await t.test("should support price filtering", async () => {
    TourPackage.find = (query) => {
      let filtered = mockTours.filter((tour) => tour.isMarketplaceVisible);
      if (query.price?.$lte) {
        filtered = filtered.filter((tour) => tour.price <= query.price.$lte);
      }

      return {
        populate: () => ({
          skip: () => ({
            limit: () => ({
              lean: async () => filtered,
            }),
          }),
        }),
      };
    };

    TourPackage.countDocuments = async () => 1;

    const res = await fetch(`${baseUrl}/api/discovery/tours?maxPrice=1000`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.tours.length, 1);
    assert.equal(body.tours[0].title, "Affordable Trek");
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
