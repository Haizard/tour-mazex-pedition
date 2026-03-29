import express from 'express';
import { getTaxonomies, createTaxonomy, deleteTaxonomy, resetTaxonomies } from '../controllers/taxonomyController.js';

const router = express.Router();

router.get('/', getTaxonomies);
router.post('/', createTaxonomy);
router.post('/reset-defaults', resetTaxonomies);
router.delete('/:id', deleteTaxonomy);

export default router;
