import TourPackage from '../models/TourPackage.js';

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
        const tours = await TourPackage.find(query).sort({ createdAt: -1 });
        res.status(200).json(tours);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single tour package
export const getTourPackage = async (req, res) => {
    try {
        const tour = await TourPackage.findById(req.params.id);
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
        const tours = await TourPackage.find({}).select('+title');
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
    const newTour = new TourPackage(tour);
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
        const updatedTour = await TourPackage.findByIdAndUpdate(id, tour, { new: true });
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
        const deletedTour = await TourPackage.findByIdAndDelete(id);
        if (!deletedTour) return res.status(404).json({ message: 'Tour package not found' });
        res.status(200).json({ message: 'Tour package deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
