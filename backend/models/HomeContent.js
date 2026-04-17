import mongoose from 'mongoose';

const homeContentSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true,
    },
    section: { type: String, required: true }, // e.g., 'destinations'
    title: { type: String },
    subtitle: { type: String },
    description: { type: String },
    quote: { type: String },
    quoteAuthor: { type: String },
}, { timestamps: true });

homeContentSchema.index({ tenantId: 1, section: 1 }, { unique: true });

const HomeContent = mongoose.model('HomeContent', homeContentSchema);
export default HomeContent;
