import mongoose from 'mongoose';

const visionarySchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true,
    },
    name: { type: String, required: true },
    duty: { type: String, required: true },
    image: { type: String, required: true },
}, { timestamps: true });

const Visionary = mongoose.model('Visionary', visionarySchema);
export default Visionary;
