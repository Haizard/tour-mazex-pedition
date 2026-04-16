import SiteSettings from '../models/SiteSettings.js';

// Get site settings
export const getSettings = async (req, res) => {
    try {
        let settings = await SiteSettings.findOne();
        if (!settings) {
            // Create default settings if none exist
            settings = await SiteSettings.create({
                facebook: '',
                twitter: '',
                instagram: '',
                whatsapp: '',
                youtube: '',
                reddit: '',
                logoUrl: ''
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update site settings
export const updateSettings = async (req, res) => {
    try {
        const { facebook, twitter, instagram, whatsapp, youtube, reddit, logoUrl } = req.body;
        let settings = await SiteSettings.findOne();
        
        if (settings) {
            settings.facebook = facebook !== undefined ? facebook : settings.facebook;
            settings.twitter = twitter !== undefined ? twitter : settings.twitter;
            settings.instagram = instagram !== undefined ? instagram : settings.instagram;
            settings.whatsapp = whatsapp !== undefined ? whatsapp : settings.whatsapp;
            settings.youtube = youtube !== undefined ? youtube : settings.youtube;
            settings.reddit = reddit !== undefined ? reddit : settings.reddit;
            settings.logoUrl = logoUrl !== undefined ? logoUrl : settings.logoUrl;
            await settings.save();
        } else {
            settings = await SiteSettings.create({
                facebook, twitter, instagram, whatsapp, youtube, reddit, logoUrl
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
