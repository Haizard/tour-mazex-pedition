import mongoose from 'mongoose';
import { createBusinessTruthMetadataSchemaDefinition } from "../utils/businessTruthSync.js";

const bookingSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    address: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    packageTour: { type: String, required: true },
    pax: { type: Number, required: true, default: 1 },
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    travelDate: { type: Date },
    notes: { type: String },
    totalPrice: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'], default: 'Pending' },
    referralCode: { type: String, trim: true },
    leadSource: { type: String, trim: true, default: "website" },
    campaignLabel: { type: String, trim: true, default: "" },
    firstTouchAt: { type: Date, default: null },
    convertedAt: { type: Date, default: null },
    quoteProposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuoteProposal',
        default: null,
    },
    revenueStage: {
        type: String,
        enum: ['new', 'quoted', 'awaiting-payment', 'partially-paid', 'paid', 'cancelled'],
        default: 'new',
        index: true,
    },
    paymentStatus: {
        type: String,
        enum: ['not-started', 'pending', 'paid', 'failed', 'cancelled', 'refunded'],
        default: 'not-started',
        index: true,
    },
    paymentRequired: { type: Boolean, default: true },
    paymentUpdatedAt: { type: Date, default: null },
    businessTruth: {
        type: new mongoose.Schema(
            createBusinessTruthMetadataSchemaDefinition({ entityKey: "bookings" }),
            { _id: false }
        ),
        default: () => ({}),
    },
    itineraryMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
        default: null,
    },
    itineraryGeneratedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
