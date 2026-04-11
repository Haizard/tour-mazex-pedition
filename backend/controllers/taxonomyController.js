import Taxonomy from '../models/Taxonomy.js';
import { defaultTaxonomies } from '../data/defaultTaxonomies.js';

const buildSlug = (name, type) =>
    `${type}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const withSlugs = (taxonomies) =>
    taxonomies.map((item) => ({
        ...item,
        slug: item.slug || buildSlug(item.name, item.type),
    }));

const sortTaxonomies = (taxonomies) =>
    [...taxonomies].sort((a, b) => {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        }
        return a.type.localeCompare(b.type);
    });

const mergeWithDefaults = (existingTaxonomies, type) => {
    const defaultItems = withSlugs(defaultTaxonomies.filter((item) => !type || item.type === type));
    const existing = existingTaxonomies.map((item) => item.toObject ? item.toObject() : item);
    const existingKeys = new Set(
        existing.map((item) => `${item.type}::${item.name}`.toLowerCase())
    );

    const merged = [
        ...existing,
        ...defaultItems.filter(
            (item) => !existingKeys.has(`${item.type}::${item.name}`.toLowerCase())
        ),
    ];

    return sortTaxonomies(withSlugs(merged));
};

export const getTaxonomies = async (req, res) => {
    try {
        const { type } = req.query;
        const filter = type ? { type } : {};
        const taxonomies = await Taxonomy.find(filter).sort({ name: 1 });

        if (!taxonomies.length) {
            const fallbackTaxonomies = sortTaxonomies(
                withSlugs(defaultTaxonomies.filter((item) => !type || item.type === type))
            );
            return res.status(200).json(fallbackTaxonomies);
        }

        res.status(200).json(mergeWithDefaults(taxonomies, type));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createTaxonomy = async (req, res) => {
    try {
        const taxonomy = new Taxonomy(req.body);
        await taxonomy.save();
        res.status(201).json(taxonomy);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteTaxonomy = async (req, res) => {
    try {
        const { id } = req.params;
        await Taxonomy.findByIdAndDelete(id);
        res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetTaxonomies = async (req, res) => {
    try {
        await Taxonomy.deleteMany({});
        const created = await Taxonomy.insertMany(withSlugs(defaultTaxonomies));
        res.status(200).json(sortTaxonomies(created.map((taxonomy) => taxonomy.toObject())));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
