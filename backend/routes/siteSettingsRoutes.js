import express from 'express';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { getSettings, updateSettings } from '../controllers/siteSettingsController.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', requireTenantAdmin, updateSettings);

export default router;
