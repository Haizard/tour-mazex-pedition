import mongoose from 'mongoose';

const taxonomySchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true,
    },
    name: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['tourCategory', 'tourType', 'blogCategory', 'destination']
    },
    slug: { type: String }
}, { timestamps: true });

// Create a slug from name before saving
taxonomySchema.pre('save', async function () {
    if (this.isModified('name') || this.isModified('type')) {
        this.slug = `${this.type}-${this.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
});

taxonomySchema.index({ tenantId: 1, slug: 1 }, { unique: true });

const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);
export default Taxonomy;
