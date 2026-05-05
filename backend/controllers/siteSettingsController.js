import SiteSettings from '../models/SiteSettings.js';
import { withDuplicateKeyRetry } from "../utils/mongoWriteRetry.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const DEFAULT_SITE_SETTINGS = Object.freeze({
    facebook: '',
    twitter: '',
    instagram: '',
    whatsapp: '',
    youtube: '',
    reddit: '',
    logoUrl: ''
});

const buildSiteSettingsUpsert = (req, overrides = {}) => ({
    $set: withTenantId(req, {
        ...DEFAULT_SITE_SETTINGS,
        ...overrides,
    }),
    $setOnInsert: withTenantId(req, DEFAULT_SITE_SETTINGS),
});

const upsertTenantSiteSettings = (req, overrides = {}) =>
    withDuplicateKeyRetry(
        () =>
            SiteSettings.findOneAndUpdate(
                buildTenantFilter(req),
                buildSiteSettingsUpsert(req, overrides),
                { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
            ),
        () =>
            SiteSettings.findOneAndUpdate(
                buildTenantFilter(req),
                {
                    $set: withTenantId(req, {
                        ...DEFAULT_SITE_SETTINGS,
                        ...overrides,
                    }),
                },
                { new: true, runValidators: true }
            )
    );

// Get site settings
export const getSettings = async (req, res) => {
    try {
        if (req.isPlatform || !req.tenantId) {
            return res.json(DEFAULT_SITE_SETTINGS);
        }

        const settings = await upsertTenantSiteSettings(req);

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update site settings
export const updateSettings = async (req, res) => {
    try {
        if (req.isPlatform || !req.tenantId) {
            return res.status(400).json({ message: "Platform site settings are not tenant-managed." });
        }

        const { facebook, twitter, instagram, whatsapp, youtube, reddit, logoUrl } = req.body;
        const settings = await upsertTenantSiteSettings(req, {
            ...(facebook !== undefined ? { facebook } : {}),
            ...(twitter !== undefined ? { twitter } : {}),
            ...(instagram !== undefined ? { instagram } : {}),
            ...(whatsapp !== undefined ? { whatsapp } : {}),
            ...(youtube !== undefined ? { youtube } : {}),
            ...(reddit !== undefined ? { reddit } : {}),
            ...(logoUrl !== undefined ? { logoUrl } : {}),
        });

        res.json(settings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
