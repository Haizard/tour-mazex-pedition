import express from 'express';
import { getGalleryPosts, createGalleryPost, deleteGalleryPost } from '../controllers/galleryController.js';

const router = express.Router();

router.get('/', getGalleryPosts);
router.post('/', createGalleryPost);
router.delete('/:id', deleteGalleryPost);

export default router;
