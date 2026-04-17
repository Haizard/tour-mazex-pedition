import TourPackage from '../models/TourPackage.js';
import Blog from '../models/Blog.js';
import { rewriteContentWithAi, generateSeoWithAi, generateFullTourPackageWithAi } from "../utils/aiRewrite.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const slugifyTitle = (value = '') =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// Get all tour packages (with search/filter)
export const getTourPackages = async (req, res) => {
    const { search, maxPrice, type } = req.query;
    let query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } }
        ];
    }

    if (maxPrice) {
        query.price = { $lte: Number(maxPrice) };
    }

    if (type) {
        query.tourType = type;
    }

    try {
        const tours = await TourPackage.find(buildTenantFilter(req, query)).sort({ createdAt: -1 });
        res.status(200).json(tours);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single tour package
export const getTourPackage = async (req, res) => {
    try {
        const tour = await TourPackage.findOne(buildTenantFilter(req, { _id: req.params.id }));
        if (!tour) return res.status(404).json({ message: 'Tour package not found' });
        res.status(200).json(tour);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single tour package by title slug
export const getTourPackageBySlug = async (req, res) => {
    try {
        const requestedSlug = slugifyTitle(decodeURIComponent(req.params.slug || ''));
        const tours = await TourPackage.find(buildTenantFilter(req)).select('+title');
        const tour = tours.find((item) => slugifyTitle(item.title) === requestedSlug);

        if (!tour) {
            return res.status(404).json({ message: 'Tour package not found' });
        }

        res.status(200).json(tour);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new tour package
export const createTourPackage = async (req, res) => {
    const tour = req.body;
    const newTour = new TourPackage(withTenantId(req, tour));
    try {
        await newTour.save();
        res.status(201).json(newTour);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

// Update a tour package
export const updateTourPackage = async (req, res) => {
    const { id } = req.params;
    const tour = req.body;
    try {
        const updatedTour = await TourPackage.findOneAndUpdate(
            buildTenantFilter(req, { _id: id }),
            tour,
            { new: true }
        );
        if (!updatedTour) return res.status(404).json({ message: 'Tour package not found' });
        res.status(200).json(updatedTour);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a tour package
export const deleteTourPackage = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedTour = await TourPackage.findOneAndDelete(buildTenantFilter(req, { _id: id }));
        if (!deletedTour) return res.status(404).json({ message: 'Tour package not found' });
        res.status(200).json({ message: 'Tour package deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const regenerateTourDescription = async (req, res) => {
    try {
        const { description, title, tourType, category, location, duration } = req.body;

        if (!description || !description.toString().trim()) {
            return res.status(400).json({ message: "Tour description is required." });
        }

        const rewritten = await rewriteContentWithAi({
            text: description,
            contentType: "tour",
            context: { title, tourType, category, location, duration },
        });

        res.status(200).json({ description: rewritten });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const generateTourSeo = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: "Tour title and description are required for SEO generation." });
        }

        const seo = await generateSeoWithAi({
            title,
            description,
            contentType: "tour",
            brandName: req.tenant?.name,
        });
        res.status(200).json(seo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const generateFullTourPackage = async (req, res) => {
    try {
        const { title, description, tourType, category, location, durationDays } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({ message: "Tour title and initial idea/description are required." });
        }

        // Fetch available blogs for internal linking context
        const availableBlogs = await Blog.find(buildTenantFilter(req)).select("title").limit(15);
        const blogContext = availableBlogs.map(b => ({
            title: b.title,
            slug: slugifyTitle(b.title) // Assuming same slug logic
        }));

        const fullPackage = await generateFullTourPackageWithAi({
            title,
            description,
            tourType,
            category,
            location,
            durationDays,
            availableBlogs: blogContext,
            brandName: req.tenant?.name,
        });

        res.status(200).json(fullPackage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
