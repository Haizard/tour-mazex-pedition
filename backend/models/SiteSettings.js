import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema({
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
