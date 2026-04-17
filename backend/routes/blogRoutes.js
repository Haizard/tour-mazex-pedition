import express from 'express';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { getAllBlogs, getBlogById, getBlogBySlug, createBlog, updateBlog, deleteBlog, regenerateBlogContent, generateBlogSeo } from '../controllers/blogController.js';
import { generateDailyBlog } from '../controllers/blogAutomationController.js';

const router = express.Router();

// Auto-generate blog
router.post('/auto-generate', generateDailyBlog);
router.post('/regenerate-content', requireTenantAdmin, regenerateBlogContent);
router.post('/generate-seo', requireTenantAdmin, generateBlogSeo);

// Get all blogs
router.get('/', getAllBlogs);

// Get single blog by slug
router.get('/slug/:slug', getBlogBySlug);

// Get single blog
router.get('/:id', getBlogById);

// Create blog
router.post('/', requireTenantAdmin, createBlog);

// Update blog
router.put('/:id', requireTenantAdmin, updateBlog);

// Delete blog
router.delete('/:id', requireTenantAdmin, deleteBlog);

export default router;
