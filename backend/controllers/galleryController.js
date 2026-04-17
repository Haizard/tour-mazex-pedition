import Gallery from '../models/Gallery.js';
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

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
    const newPost = new Gallery(withTenantId(req, post));
    try {
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
