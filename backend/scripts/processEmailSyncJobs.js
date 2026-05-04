import process from "node:process";
import { processQueuedEmailSyncJobsNow } from "../utils/emailSyncProcessor.js";

processQueuedEmailSyncJobsNow()
  .then((summary) => {
    console.log(`Processed ${summary.processed} email sync jobs.`);
  })
  .catch((error) => {
    console.error("Email sync job processing failed:", error);
    process.exitCode = 1;
  });
