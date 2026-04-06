import express from 'express';
import { getTourPackages, getTourPackage, getTourPackageBySlug, createTourPackage, updateTourPackage, deleteTourPackage, regenerateTourDescription, generateTourSeo } from '../controllers/tourController.js';

const router = express.Router();

router.get('/', getTourPackages);
router.post('/regenerate-description', regenerateTourDescription);
router.post('/generate-seo', generateTourSeo);
router.get('/slug/:slug', getTourPackageBySlug);
router.get('/:id', getTourPackage);
router.post('/', createTourPackage);
router.put('/:id', updateTourPackage);
router.delete('/:id', deleteTourPackage);

export default router;
