import mongoose from 'mongoose';
import TourPackage from './backend/models/TourPackage.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const test = async () => {
    try {
        console.log('Connecting to...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');
        const tours = await TourPackage.find({}).limit(1);
        console.log('Found tours:', tours.length);
        console.log('Sample tour:', tours[0]);
        process.exit(0);
    } catch (error) {
        console.error('Error details:');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

test();
