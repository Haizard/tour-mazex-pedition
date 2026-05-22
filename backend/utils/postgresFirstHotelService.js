import mongoose from "mongoose";
import Hotel from "../models/Hotel.js";
import { syncHotelRecord } from "./postgresHotelRecords.js";
import { syncHotelListingVector } from "./postgresHotelVectorService.js";
import { syncMongoDocumentToShadowStore } from "./postgresShadowWrites.js";

export const createPostgresFirstHotel = async (payload = {}, env = globalThis.process?.env || {}) => {
  if (!payload.tenantId) {
    throw new Error("Tenant ID is required for hotel creation.");
  }

  const sharedId = payload._id || new mongoose.Types.ObjectId();
  const hotelData = {
    ...payload,
    _id: sharedId,
    businessTruth: {
      ...(payload.businessTruth || {}),
      entityKey: "hotels",
      currentOwner: "postgresql",
      targetOwner: "postgresql",
      migrationMode: "postgres-first",
      migrationStatus: "cutover",
      shadowWriteEnabled: true,
      canonicalId: `hotels:${sharedId}`,
    },
    createdAt: payload.createdAt || new Date(),
    updatedAt: new Date(),
  };

  await syncHotelRecord(hotelData, env);

  try {
    const hotel = new Hotel(hotelData);
    await hotel.save();
    await syncHotelListingVector(hotel.toObject(), env).catch((error) => {
      console.error("Hotel vector sync failed:", error.message);
    });
    await syncMongoDocumentToShadowStore({
      entityType: "hotels",
      document: hotel.toObject(),
      model: Hotel,
      env,
    });
    return hotel;
  } catch (mongoError) {
    console.error(`[ShadowWriteError] Hotel MongoDB shadow failed for ${sharedId}:`, mongoError.message);
    return hotelData;
  }
};

export const updatePostgresFirstHotel = async (
  hotelId,
  tenantId,
  updates = {},
  env = globalThis.process?.env || {}
) => {
  const currentHotel = await Hotel.findOne({ _id: hotelId, tenantId }).lean();
  if (!currentHotel) {
    throw new Error("Hotel not found.");
  }

  const updatedData = {
    ...currentHotel,
    ...updates,
    updatedAt: new Date(),
  };

  await syncHotelRecord(updatedData, env);

  try {
    const hotel = await Hotel.findOneAndUpdate(
      { _id: hotelId, tenantId },
      { $set: updates },
      { new: true }
    ).lean();

    if (hotel) {
      await syncHotelListingVector(hotel, env).catch((error) => {
        console.error("Hotel vector sync failed:", error.message);
      });
      await syncMongoDocumentToShadowStore({
        entityType: "hotels",
        document: hotel,
        model: Hotel,
        env,
      });
      return hotel;
    }
  } catch (mongoError) {
    console.error(`[ShadowWriteError] Hotel MongoDB shadow update failed for ${hotelId}:`, mongoError.message);
  }

  return updatedData;
};
