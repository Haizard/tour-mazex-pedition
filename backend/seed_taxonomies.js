import mongoose from 'mongoose';
import Taxonomy from './models/Taxonomy.js';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const initialTaxonomies = [
            { name: "Safari", type: "tourType" },
            { name: "Trekking", type: "tourType" },
            { name: "Beach Holiday", type: "tourType" },
            { name: "Cultural Tour", type: "tourType" },
            { name: "Day Trip", type: "tourType" },

            { name: "Luxury", type: "tourCategory" },
            { name: "Mid-Range", type: "tourCategory" },
            { name: "Budget", type: "tourCategory" },
            { name: "Family Friendly", type: "tourCategory" },

            { name: "Travel Tips", type: "blogCategory" },
            { name: "News", type: "blogCategory" },
            { name: "Destinations", type: "blogCategory" },
            { name: "Culture", type: "blogCategory" }
        ];

        // Clear existing and seed
        await Taxonomy.deleteMany({});
        await Taxonomy.insertMany(initialTaxonomies);

        console.log("Taxonomies seeded successfully!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seed();
