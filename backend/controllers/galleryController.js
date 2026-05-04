import Gallery from '../models/Gallery.js';
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import { storeGeneratedMediaAsset } from "../utils/generatedMediaStorage.js";

const slugifyFilenamePart = (value = "") =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "gallery-image";

export const resolveGalleryImageAsset = async ({
    img = "",
    tenantId = "",
    location = "",
    storeMediaAsset = storeGeneratedMediaAsset,
} = {}) => {
    const normalizedImage = String(img || "").trim();

    if (!normalizedImage || !normalizedImage.startsWith("data:")) {
        return {
            img: normalizedImage,
            imageMediaId: null,
        };
    }

    const storedMedia = await storeMediaAsset({
        tenantId,
        filenameBase: `gallery-${slugifyFilenamePart(location)}`,
        dataUrl: normalizedImage,
    });

    return {
        img: storedMedia.url,
        imageMediaId: storedMedia.mediaId,
    };
};

// Get all gallery posts
export const getGalleryPosts = async (req, res) => {
    try {
        const posts = await Gallery.find(buildTenantFilter(req)).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new gallery post
export const createGalleryPost = async (req, res) => {
    const post = req.body;
    try {
        const resolvedImage = await resolveGalleryImageAsset({
            img: post.img,
            tenantId: req.tenantId,
            location: post.location,
        });

        const newPost = new Gallery(
            withTenantId(req, {
                ...post,
                ...resolvedImage,
            })
        );
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

// Delete a gallery post
export const deleteGalleryPost = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedPost = await Gallery.findOneAndDelete(buildTenantFilter(req, { _id: id }));
        if (!deletedPost) return res.status(404).json({ message: 'Gallery post not found' });
        res.status(200).json({ message: 'Gallery post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
