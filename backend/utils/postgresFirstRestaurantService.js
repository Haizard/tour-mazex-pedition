import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import { syncRestaurantRecord } from "./postgresRestaurantRecords.js";
import { syncMongoDocumentToShadowStore } from "./postgresShadowWrites.js";

export const createPostgresFirstRestaurant = async (
  payload = {},
  env = globalThis.process?.env || {}
) => {
  if (!payload.tenantId) {
    throw new Error("Tenant ID is required for restaurant creation.");
  }

  const sharedId = payload._id || new mongoose.Types.ObjectId();
  const restaurantData = {
    ...payload,
    _id: sharedId,
    businessTruth: {
      ...(payload.businessTruth || {}),
      entityKey: "restaurants",
      currentOwner: "postgresql",
      targetOwner: "postgresql",
      migrationMode: "postgres-first",
      migrationStatus: "cutover",
      shadowWriteEnabled: true,
      canonicalId: `restaurants:${sharedId}`,
    },
    createdAt: payload.createdAt || new Date(),
    updatedAt: new Date(),
  };

  await syncRestaurantRecord(restaurantData, env);

  try {
    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();
    await syncMongoDocumentToShadowStore({
      entityType: "restaurants",
      document: restaurant.toObject(),
      model: Restaurant,
      env,
    });
    return restaurant;
  } catch (mongoError) {
    console.error(
      `[ShadowWriteError] Restaurant MongoDB shadow failed for ${sharedId}:`,
      mongoError.message
    );
    return restaurantData;
  }
};

export const updatePostgresFirstRestaurant = async (
  restaurantId,
  tenantId,
  updates = {},
  env = globalThis.process?.env || {}
) => {
  const currentRestaurant = await Restaurant.findOne({ _id: restaurantId, tenantId }).lean();
  if (!currentRestaurant) {
    throw new Error("Restaurant not found.");
  }

  const updatedData = {
    ...currentRestaurant,
    ...updates,
    updatedAt: new Date(),
  };

  await syncRestaurantRecord(updatedData, env);

  try {
    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: restaurantId, tenantId },
      { $set: updates },
      { new: true }
    ).lean();

    if (restaurant) {
      await syncMongoDocumentToShadowStore({
        entityType: "restaurants",
        document: restaurant,
        model: Restaurant,
        env,
      });
      return restaurant;
    }
  } catch (mongoError) {
    console.error(
      `[ShadowWriteError] Restaurant MongoDB shadow update failed for ${restaurantId}:`,
      mongoError.message
    );
  }

  return updatedData;
};
