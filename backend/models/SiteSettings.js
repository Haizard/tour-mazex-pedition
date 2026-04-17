import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true,
        unique: true,
    },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    youtube: { type: String, default: '' },
    reddit: { type: String, default: '' },
    logoUrl: { type: String, default: '' }, // Future proofing
}, { timestamps: true });

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
export default SiteSettings;
