import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, required: true },
    author: { type: String, default: "Admin" },
    category: { type: String },
    date: { type: String, default: () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
    views: { type: Number, default: 0, min: 0 },
    seo: {
        title: { type: String },
        description: { type: String },
        keywords: [{ type: String }],
        ogImage: { type: String },
        canonicalUrl: { type: String },
        schema: { type: String }
    }
}, { timestamps: true });

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
