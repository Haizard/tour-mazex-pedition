import mongoose from "mongoose";
import { ensureLegacyTenantFoundation } from "./tenantBootstrap.js";

const GLOBAL_DATABASE_KEY = "__mazexDatabaseState__";
const isVercelRuntime = Boolean(process.env.VERCEL);

mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", 0);

const getDatabaseState = () => {
  if (!globalThis[GLOBAL_DATABASE_KEY]) {
    globalThis[GLOBAL_DATABASE_KEY] = {
      connectionPromise: null,
      listenersRegistered: false,
      legacyFoundationPromise: null,
      legacyFoundationReady: false,
    };
  }

  return globalThis[GLOBAL_DATABASE_KEY];
};

const getMongoConnectOptions = () => ({
  maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || (isVercelRuntime ? 5 : 15)),
  minPoolSize: 0,
  maxIdleTimeMS: Number(process.env.MONGODB_MAX_IDLE_MS || 30000),
  serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 10000),
  socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45000),
  family: 4,
  autoIndex: process.env.NODE_ENV !== "production",
});

export const registerMongooseListeners = () => {
  const state = getDatabaseState();

  if (state.listenersRegistered) {
    return;
  }

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    state.connectionPromise = null;
    state.legacyFoundationPromise = null;
    state.legacyFoundationReady = false;
    console.warn("MongoDB disconnected");
  });

  state.listenersRegistered = true;
};

const ensureLegacyFoundationReady = async () => {
  const state = getDatabaseState();

  if (!state.legacyFoundationPromise) {
    state.legacyFoundationPromise = ensureLegacyTenantFoundation()
      .then(() => {
        state.legacyFoundationReady = true;
      })
      .catch((error) => {
        state.legacyFoundationPromise = null;
        state.legacyFoundationReady = false;
        throw error;
      });
  }

  return state.legacyFoundationPromise;
};

export const connectDB = async () => {
  registerMongooseListeners();

  if (mongoose.connection.readyState === 1) {
    await ensureLegacyFoundationReady();
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  const state = getDatabaseState();

  if (!state.connectionPromise) {
    state.connectionPromise = mongoose
      .connect(mongoUri, getMongoConnectOptions())
      .then(async (connection) => {
        console.log("Connected to MongoDB");
        await ensureLegacyFoundationReady();
        return connection;
      })
      .catch((error) => {
        state.connectionPromise = null;
        state.legacyFoundationPromise = null;
        state.legacyFoundationReady = false;
        throw error;
      });
  }

  return state.connectionPromise;
};

export const getDatabaseHealth = async () => {
  const state = getDatabaseState();
  const readyState = mongoose.connection.readyState;
  const hasConnection = readyState === 1;

  if (!hasConnection) {
    return {
      readyState,
      connected: false,
      pingOk: false,
      legacyFoundationReady: state.legacyFoundationReady,
    };
  }

  try {
    await mongoose.connection.db.admin().ping();
    return {
      readyState,
      connected: true,
      pingOk: true,
      legacyFoundationReady: state.legacyFoundationReady,
    };
  } catch (error) {
    return {
      readyState,
      connected: true,
      pingOk: false,
      legacyFoundationReady: state.legacyFoundationReady,
      errorMessage: error.message,
    };
  }
};
