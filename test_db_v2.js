import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const test = async () => {
    try {
        console.log('Connecting to...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');
        
        // Use a generic connection to check collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections catalog:', collections.map(c => c.name));
        
        const TaxSchema = new mongoose.Schema({ name: String, type: String });
        const TaxModel = mongoose.model('Taxonomy_test', TaxSchema, 'taxonomies');
        const items = await TaxModel.find({}).limit(1);
        console.log('Found taxonomies:', items.length);
        if (items.length > 0) console.log('Sample:', items[0].name);
        
        process.exit(0);
    } catch (error) {
        console.error('Error details:');
        console.error('Message:', error.message);
        process.exit(1);
    }
};

test();
