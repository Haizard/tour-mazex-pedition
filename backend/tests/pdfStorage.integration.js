import mongoose from "mongoose";
import dotenv from "dotenv";
import { persistInvoicePdf } from "../utils/invoicePdfStorage.js";
import { persistItineraryPdf } from "../utils/itineraryPdfStorage.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import Booking from "../models/Booking.js";
import Media from "../models/Media.js";
import Tenant from "../models/Tenant.js";
import assert from "node:assert";

dotenv.config();

const testIntegration = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);

  const tenantId = new mongoose.Types.ObjectId();
  
  try {
    console.log("Creating test booking...");
    const booking = new Booking({
      tenantId,
      name: "Test Traveler",
      email: "test@example.com",
      address: "123 Test St",
      phone: "+123456789",
      packageTour: "Integration Test Safari",
      totalPrice: 2000,
      status: "Pending",
    });
    await booking.save();

    console.log("Creating test payment...");
    const transaction = new PaymentTransaction({
      tenantId,
      bookingId: booking._id,
      customerName: "Test Traveler",
      amount: 2000,
      currency: "USD",
      status: "paid",
      provider: "stripe",
      paidAt: new Date(),
    });
    await transaction.save();

    console.log("Testing persistInvoicePdf...");
    const updatedTransaction = await persistInvoicePdf({
      transactionId: transaction._id,
      tenantId,
    });

    assert.ok(updatedTransaction.invoiceMediaId, "Invoice Media ID should be present");
    assert.ok(updatedTransaction.invoiceGeneratedAt, "Invoice Generated At should be present");
    
    const invoiceMedia = await Media.findById(updatedTransaction.invoiceMediaId);
    assert.strictEqual(invoiceMedia.contentType, "application/pdf", "Media type should be PDF");
    console.log("✓ Invoice PDF generated and linked successfully.");

    console.log("Testing persistItineraryPdf...");
    const updatedBooking = await persistItineraryPdf({
      bookingId: booking._id,
      tenantId,
    });

    assert.ok(updatedBooking.itineraryMediaId, "Itinerary Media ID should be present");
    assert.ok(updatedBooking.itineraryGeneratedAt, "Itinerary Generated At should be present");

    const itineraryMedia = await Media.findById(updatedBooking.itineraryMediaId);
    assert.strictEqual(itineraryMedia.contentType, "application/pdf", "Media type should be PDF");
    console.log("✓ Itinerary PDF generated and linked successfully.");

  } finally {
    console.log("Cleaning up test data...");
    await Booking.deleteMany({ tenantId });
    await PaymentTransaction.deleteMany({ tenantId });
    await Media.deleteMany({ tenantId });
    await mongoose.disconnect();
  }
};

testIntegration().catch((err) => {
  console.error("Integration test failed:", err);
  process.exit(1);
});
