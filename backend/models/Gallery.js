import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true,
    },
    img: { type: String, required: true },
    location: { type: String, required: true },
    caption: { type: String },
}, { timestamps: true });

const Gallery = mongoose.model('Gallery', gallerySchema);
export default Gallery;
