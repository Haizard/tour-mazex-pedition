import mongoose from 'mongoose';

const homeContentSchema = new mongoose.Schema({
    section: { type: String, required: true, unique: true }, // e.g., 'destinations'
    title: { type: String },
    subtitle: { type: String },
    description: { type: String },
    quote: { type: String },
    quoteAuthor: { type: String },
}, { timestamps: true });

const HomeContent = mongoose.model('HomeContent', homeContentSchema);
export default HomeContent;
