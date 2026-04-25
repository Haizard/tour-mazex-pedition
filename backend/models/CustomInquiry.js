import mongoose from 'mongoose';

const customInquirySchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    familyName: { type: String, trim: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    destinations: [{ type: String, required: true }],
    tripLengthDays: { type: Number, required: true, min: 1 },
    adults: { type: Number, required: true, min: 1 },
    childrenUnder5: { type: Number, default: 0, min: 0 },
    children6To15: { type: Number, default: 0, min: 0 },
    travelWhen: { type: String, required: true, trim: true },
    sleepingArrangement: { type: String, required: true, trim: true },
    accommodationPreferences: [{ type: String, required: true }],
    contactPreference: {
        type: String,
        enum: ["whatsapp", "email", "phone"],
        required: true,
        default: "whatsapp"
    },
    duration: { type: String },
    budget: { type: String },
    services: [{ type: String }],
    message: { type: String, required: true },
    sourceChannel: {
        type: String,
        enum: ['website', 'plan-my-trip', 'whatsapp-button', 'chatbot'],
        default: 'website'
    },
    leadStage: {
        type: String,
        enum: ['new', 'qualified', 'follow-up', 'booked', 'closed'],
        default: 'new'
    },
    leadScore: { type: Number, min: 0, max: 100, default: 0 },
    leadTemperature: {
        type: String,
        enum: ['hot', 'warm', 'cold'],
        default: 'cold'
    },
    leadScoreReasons: [{ type: String }],
    automationSummary: { type: String, default: '' },
    followUpMessage: { type: String, default: '' },
    whatsappAutomation: {
        outboundMessageCount: { type: Number, default: 0, min: 0 },
        lastMessageAt: { type: Date, default: null },
        lastMessagePreview: { type: String, default: '' },
        lastExternalMessageId: { type: String, default: '' },
        lastDeliveryStatus: {
            type: String,
            enum: ['not-sent', 'sent', 'failed'],
            default: 'not-sent'
        }
    },
    status: { type: String, enum: ['Pending', 'Contacted', 'Booked', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

const CustomInquiry = mongoose.model('CustomInquiry', customInquirySchema);
export default CustomInquiry;
