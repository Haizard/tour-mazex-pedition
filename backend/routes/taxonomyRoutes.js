import express from 'express';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { getTaxonomies, createTaxonomy, deleteTaxonomy, resetTaxonomies } from '../controllers/taxonomyController.js';

const router = express.Router();

router.get('/', getTaxonomies);
router.post('/', requireTenantAdmin, createTaxonomy);
router.post('/reset-defaults', requireTenantAdmin, resetTaxonomies);
router.delete('/:id', requireTenantAdmin, deleteTaxonomy);

export default router;
