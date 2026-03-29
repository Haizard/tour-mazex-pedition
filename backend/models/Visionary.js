import mongoose from 'mongoose';

const visionarySchema = new mongoose.Schema({
    name: { type: String, required: true },
    duty: { type: String, required: true },
    image: { type: String, required: true },
}, { timestamps: true });

const Visionary = mongoose.model('Visionary', visionarySchema);
export default Visionary;
