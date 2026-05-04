import express from 'express';
import process from 'node:process';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { getAllBlogs, getBlogById, getBlogBySlug, createBlog, updateBlog, deleteBlog, regenerateBlogContent, generateBlogSeo } from '../controllers/blogController.js';
import { generateDailyBlog } from '../controllers/blogAutomationController.js';
import { searchAssistantKnowledge } from '../utils/pgvectorRetrieval.js';
import TourPackage from '../models/TourPackage.js';
import Blog from '../models/Blog.js';
import { buildTenantFilter } from '../utils/tenantContext.js';

const router = express.Router();

// Auto-generate blog
router.post('/auto-generate', generateDailyBlog);
router.post('/regenerate-content', requireTenantAdmin, regenerateBlogContent);
router.post('/generate-seo', requireTenantAdmin, generateBlogSeo);

// Get all blogs
router.get('/', getAllBlogs);

// Get single blog by slug
router.get('/slug/:slug', getBlogBySlug);

// [SEMANTIC] Get tours semantically related to this blog post
router.get('/:id/related-tours', async (req, res) => {
    try {
        const blog = await Blog.findOne(buildTenantFilter(req, { _id: req.params.id })).lean();
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        const searchQuery = [
            blog.title,
            blog.category,
            String(blog.content || '').substring(0, 600),
        ].filter(Boolean).join(' ');

        const vectorResults = await searchAssistantKnowledge({
            tenantId: String(req.tenantId),
            query: searchQuery,
            sourceTypes: ['tour-package'],
            limit: 4,
            env: process.env,
        });

        const tourIds = vectorResults.tourIds || [];
        if (!tourIds.length) return res.status(200).json([]);

        const tours = await TourPackage.find(
            buildTenantFilter(req, { _id: { $in: tourIds } })
        ).lean();

        const sorted = tourIds
            .map(id => tours.find(t => String(t._id) === String(id)))
            .filter(Boolean);

        res.status(200).json(sorted);
    } catch (error) {
        console.error('[SemanticDiscovery] Blog -> Tours failed:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Get single blog by id
router.get('/:id', getBlogById);

// Create blog
router.post('/', requireTenantAdmin, createBlog);

// Update blog
router.put('/:id', requireTenantAdmin, updateBlog);

// Delete blog
router.delete('/:id', requireTenantAdmin, deleteBlog);

export default router;
