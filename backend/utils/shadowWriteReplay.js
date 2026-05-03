import CustomInquiry from "../models/CustomInquiry.js";
import { replayQueuedShadowWrites } from "./postgresShadowWrites.js";

export const replayShadowWritesNow = async (env = globalThis.process?.env || {}) =>
  replayQueuedShadowWrites({ env });

export const shadowWriteReplayModelMap = {
  travelers: CustomInquiry,
};
