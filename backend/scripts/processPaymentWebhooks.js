import process from "node:process";
import { processQueuedPaymentWebhooksNow } from "../utils/paymentWebhookProcessor.js";

processQueuedPaymentWebhooksNow()
  .then((summary) => {
    console.log(`Processed ${summary.processed} payment webhook jobs.`);
    if (summary.ignored) {
      console.log(`Ignored ${summary.ignored} duplicate webhook jobs.`);
    }
  })
  .catch((error) => {
    console.error("Payment webhook processing failed:", error);
    process.exitCode = 1;
  });
