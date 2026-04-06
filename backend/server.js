import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import tourRoutes from './routes/tourRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import customInquiryRoutes from './routes/customInquiryRoutes.js';
import taxonomyRoutes from './routes/taxonomyRoutes.js';
import visionaryRoutes from './routes/visionaryRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import contactMessageRoutes from './routes/contactMessageRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import seoRoutes from './routes/seoRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173", "https://mazexpeditions.com", "https://tourism-website-inky.vercel.app"],
    credentials: true
}));

// Routes
app.use('/api/tours', tourRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/custom-inquiries', customInquiryRoutes);
app.use('/api/taxonomies', taxonomyRoutes);
app.use('/api/visionaries', visionaryRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/contact-messages', contactMessageRoutes);
app.use('/api/menu-items', menuRoutes);

// Root SEO routes (for indexing)
app.use('/', seoRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('Tourism API is running...');
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is listening on port: ${PORT}`);
});

// Database connection
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;

    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is not defined in environment variables');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
    }
};

// Execute connection
connectDB();

export default app;
