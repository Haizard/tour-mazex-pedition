
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
});
const Blog = mongoose.model('Blog', blogSchema);

const slugify = (text = '') =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const blogs = await Blog.find();
        console.log(`Found ${blogs.length} blogs`);

        const slugToMatch = "beyond-the-dust-why-tanzanias-emerald-season-is-the-safari-connoisseurs-best-kept-secret";

        blogs.forEach(blog => {
            const blogSlug = slugify(blog.title);
            console.log(`Title: "${blog.title}"`);
            console.log(`Slug: "${blogSlug}"`);
            if (blogSlug === slugToMatch) {
                console.log('>>> MATCHED! <<<');
            }
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
