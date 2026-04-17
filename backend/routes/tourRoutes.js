import express from 'express';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { getTourPackages, getTourPackage, getTourPackageBySlug, createTourPackage, updateTourPackage, deleteTourPackage, regenerateTourDescription, generateTourSeo, generateFullTourPackage } from '../controllers/tourController.js';

const router = express.Router();

router.get('/', getTourPackages);
router.post('/regenerate-description', requireTenantAdmin, regenerateTourDescription);
router.post('/generate-seo', requireTenantAdmin, generateTourSeo);
router.post('/generate-full', requireTenantAdmin, generateFullTourPackage);
router.get('/slug/:slug', getTourPackageBySlug);
router.get('/:id', getTourPackage);
router.post('/', requireTenantAdmin, createTourPackage);
router.put('/:id', requireTenantAdmin, updateTourPackage);
router.delete('/:id', requireTenantAdmin, deleteTourPackage);

export default router;
