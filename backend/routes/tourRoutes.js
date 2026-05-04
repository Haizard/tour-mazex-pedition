import express from 'express';
import process from 'node:process';
import { requireTenantAdmin } from '../middleware/adminAuthMiddleware.js';
import { getTourPackages, getTourPackage, getTourPackageBySlug, createTourPackage, updateTourPackage, deleteTourPackage, regenerateTourDescription, generateTourSeo, generateFullTourPackage } from '../controllers/tourController.js';
import { searchAssistantKnowledge } from '../utils/pgvectorRetrieval.js';
import Blog from '../models/Blog.js';
import TourPackage from '../models/TourPackage.js';
import { buildTenantFilter } from '../utils/tenantContext.js';

const router = express.Router();

router.get('/', getTourPackages);
router.post('/regenerate-description', requireTenantAdmin, regenerateTourDescription);
router.post('/generate-seo', requireTenantAdmin, generateTourSeo);
router.post('/generate-full', requireTenantAdmin, generateFullTourPackage);
router.get('/slug/:slug', getTourPackageBySlug);

// [SEMANTIC] Get blog posts semantically related to this tour package
router.get('/:id/related-blogs', async (req, res) => {
    try {
        const tour = await TourPackage.findOne(buildTenantFilter(req, { _id: req.params.id })).lean();
        if (!tour) return res.status(404).json({ message: 'Tour package not found' });

        const searchQuery = [
            tour.title,
            tour.tourType,
            tour.category,
            tour.location,
            String(tour.description || '').substring(0, 500),
            ...(Array.isArray(tour.destinationsVisited) ? tour.destinationsVisited : []),
        ].filter(Boolean).join(' ');

        const vectorResults = await searchAssistantKnowledge({
            tenantId: String(req.tenantId),
            query: searchQuery,
            sourceTypes: ['blog-post'],
            limit: 4,
            env: process.env,
        });

        const blogIds = vectorResults.blogIds || [];
        if (!blogIds.length) return res.status(200).json([]);

        const blogs = await Blog.find(
            buildTenantFilter(req, { _id: { $in: blogIds } })
        ).lean();

        const sorted = blogIds
            .map(id => blogs.find(b => String(b._id) === String(id)))
            .filter(Boolean);

        res.status(200).json(sorted);
    } catch (error) {
        console.error('[SemanticDiscovery] Tour -> Blogs failed:', error.message);
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', getTourPackage);
router.post('/', requireTenantAdmin, createTourPackage);
router.put('/:id', requireTenantAdmin, updateTourPackage);
router.delete('/:id', requireTenantAdmin, deleteTourPackage);

export default router;
