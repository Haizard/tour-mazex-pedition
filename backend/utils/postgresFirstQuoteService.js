import mongoose from "mongoose";
import QuoteProposal from "../models/QuoteProposal.js";
import { syncQuoteRevenueRecord } from "./postgresRevenueRecords.js";
import { syncMongoDocumentToShadowStore } from "./postgresShadowWrites.js";

/**
 * Orchestrates a PostgreSQL-first write for a Quote.
 * Ensures relational integrity first, then shadows back to MongoDB.
 */
export const createPostgresFirstQuote = async (payload = {}, env = globalThis.process?.env || {}) => {
  const tenantId = payload.tenantId;
  if (!tenantId) {
    throw new Error("Tenant ID is required for quote creation.");
  }

  // 1. Generate authoritative ID
  const sharedId = payload._id || new mongoose.Types.ObjectId();
  const quoteData = {
    ...payload,
    _id: sharedId,
    updatedAt: new Date(),
    createdAt: payload.createdAt || new Date(),
  };

  // 2. PRIMARY: Write to PostgreSQL
  await syncQuoteRevenueRecord(quoteData, env);

  // 3. SECONDARY: Shadow back to MongoDB
  const mongoQuote = new QuoteProposal(quoteData);
  await mongoQuote.save();

  // 4. Update shadow metadata
  await syncMongoDocumentToShadowStore({
    entityType: "quotes",
    document: mongoQuote.toObject(),
    model: QuoteProposal,
    env,
  });

  return mongoQuote;
};

/**
 * Orchestrates a PostgreSQL-first update for a Quote.
 */
export const updatePostgresFirstQuote = async (
  quoteId,
  tenantId,
  updates = {},
  env = globalThis.process?.env || {}
) => {
  // 1. Fetch current state from Mongo
  const currentQuote = await QuoteProposal.findOne({ _id: quoteId, tenantId }).lean();
  if (!currentQuote) {
    throw new Error("Quote not found.");
  }

  const updatedData = {
    ...currentQuote,
    ...updates,
    updatedAt: new Date(),
  };

  // 2. PRIMARY: Update PostgreSQL
  await syncQuoteRevenueRecord(updatedData, env);

  // 3. SECONDARY: Update MongoDB
  const mongoQuote = await QuoteProposal.findOneAndUpdate(
    { _id: quoteId, tenantId },
    { $set: updates },
    { new: true }
  ).lean();

  // 4. Update shadow metadata
  await syncMongoDocumentToShadowStore({
    entityType: "quotes",
    document: mongoQuote,
    model: QuoteProposal,
    env,
  });

  return mongoQuote;
};

/**
 * Orchestrates a PostgreSQL-first multi-update for Quotes (e.g. status sync).
 */
export const updateManyPostgresFirstQuotes = async (
  filter = {},
  updates = {},
  env = globalThis.process?.env || {}
) => {
  // 1. Find matches in Mongo
  const quotes = await QuoteProposal.find(filter).lean();
  const results = [];

  for (const quote of quotes) {
    results.push(await updatePostgresFirstQuote(quote._id, quote.tenantId, updates, env));
  }

  return results;
};
