import mongoose from 'mongoose';

const customInquirySchema = new mongoose.Schema({
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
    status: { type: String, enum: ['Pending', 'Contacted', 'Booked', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

const CustomInquiry = mongoose.model('CustomInquiry', customInquirySchema);
export default CustomInquiry;
