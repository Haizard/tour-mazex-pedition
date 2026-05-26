import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { readFile } from "node:fs/promises";

import discoveryRoutes from "../routes/discoveryRoutes.js";
import Hotel from "../models/Hotel.js";
import Restaurant from "../models/Restaurant.js";
import TourPackage from "../models/TourPackage.js";

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

test("discovery routes expose hospitality recommendations from marketplace sources", async () => {
  const source = await readFile(
    new URL("../routes/discoveryRoutes.js", import.meta.url),
    "utf8"
  );

  assert.equal(source.includes('router.get("/hospitality/recommendations"'), true);
  assert.equal(source.includes("buildHospitalityRecommendations"), true);
  assert.equal(source.includes("Hotel.find"), true);
  assert.equal(source.includes("Restaurant.find"), true);
});

test("hospitality recommendations handle invalid tour source IDs without leaking errors", async (t) => {
  const app = express();
  app.use(express.json());
  app.use("/api/discovery", discoveryRoutes);

  const { server, baseUrl } = await startTestServer(app);
  t.after(() => server.close());

  const originalHotelFind = Hotel.find;
  const originalRestaurantFind = Restaurant.find;
  const originalTourFind = TourPackage.find;
  const originalTourFindOne = TourPackage.findOne;
  let tourFindOneCalls = 0;

  t.after(() => {
    Hotel.find = originalHotelFind;
    Restaurant.find = originalRestaurantFind;
    TourPackage.find = originalTourFind;
    TourPackage.findOne = originalTourFindOne;
  });

  Hotel.find = () => ({
    lean: async () => [
      {
        _id: "hotel_1",
        name: "Arusha Garden Lodge",
        destination: "Arusha",
        published: true,
        marketplaceVisible: true,
      },
    ],
  });
  Restaurant.find = () => ({
    lean: async () => [
      {
        _id: "restaurant_1",
        name: "Garden Table",
        destination: "Arusha",
        published: true,
        marketplaceVisible: true,
      },
    ],
  });
  TourPackage.find = () => ({
    lean: async () => [],
  });
  TourPackage.findOne = () => {
    tourFindOneCalls += 1;
    throw new Error("Cast to ObjectId failed");
  };

  const res = await fetch(
    `${baseUrl}/api/discovery/hospitality/recommendations?sourceType=tour&sourceId=not-an-object-id&destination=Arusha`
  );
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(tourFindOneCalls, 0);
  assert.equal(Object.hasOwn(body, "error"), false);
  assert.equal(Array.isArray(body.recommendations), true);
});
