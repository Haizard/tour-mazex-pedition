import process from "node:process";
import { processQueuedSocialPostsNow } from "../utils/socialPostProcessor.js";

processQueuedSocialPostsNow()
  .then((summary) => {
    console.log(`Processed ${summary.processed} scheduled social posts.`);
  })
  .catch((error) => {
    console.error("Scheduled social post processing failed:", error);
    process.exitCode = 1;
  });
