import mongoose from 'mongoose';

const taxonomySchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['tourCategory', 'tourType', 'blogCategory']
    },
    slug: { type: String, unique: true }
}, { timestamps: true });

// Create a slug from name before saving
taxonomySchema.pre('save', async function () {
    if (this.isModified('name') || this.isModified('type')) {
        this.slug = `${this.type}-${this.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
});

const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);
export default Taxonomy;
