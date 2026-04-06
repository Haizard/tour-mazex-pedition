import express from 'express';
import { getAllBlogs, getBlogById, getBlogBySlug, createBlog, updateBlog, deleteBlog, regenerateBlogContent, generateBlogSeo } from '../controllers/blogController.js';
import { generateDailyBlog } from '../controllers/blogAutomationController.js';

const router = express.Router();

// Auto-generate blog
router.post('/auto-generate', generateDailyBlog);
router.post('/regenerate-content', regenerateBlogContent);
router.post('/generate-seo', generateBlogSeo);

// Get all blogs
router.get('/', getAllBlogs);

// Get single blog by slug
router.get('/slug/:slug', getBlogBySlug);

// Get single blog
router.get('/:id', getBlogById);

// Create blog
router.post('/', createBlog);

// Update blog
router.put('/:id', updateBlog);

// Delete blog
router.delete('/:id', deleteBlog);

export default router;
