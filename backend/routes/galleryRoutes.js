import express from 'express';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { getGalleryPosts, createGalleryPost, deleteGalleryPost } from '../controllers/galleryController.js';

const router = express.Router();

router.get('/', getGalleryPosts);
router.post('/', requireTenantAdmin, createGalleryPost);
router.delete('/:id', requireTenantAdmin, deleteGalleryPost);

export default router;
