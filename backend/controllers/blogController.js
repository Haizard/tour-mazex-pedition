import Blog from '../models/Blog.js';
import { rewriteContentWithAi, generateSeoWithAi } from "../utils/aiRewrite.js";

const slugify = (text = '') =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');

const normalizeBlog = (blogDoc) => {
    const blog = blogDoc.toObject ? blogDoc.toObject() : blogDoc;

    return {
        ...blog,
        views: typeof blog.views === 'number' ? blog.views : 0,
    };
};

export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.status(200).json(blogs.map(normalizeBlog));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getBlogBySlug = async (req, res) => {
    try {
        const blogs = await Blog.find();
        const blog = blogs.find((item) => slugify(item.title) === req.params.slug);

        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        blog.views = typeof blog.views === 'number' ? blog.views + 1 : 1;
        await blog.save();

        res.status(200).json(normalizeBlog(blog));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(444).json({ message: 'Blog not found' });

        blog.views = typeof blog.views === 'number' ? blog.views + 1 : 1;
        await blog.save();

        res.status(200).json(normalizeBlog(blog));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createBlog = async (req, res) => {
    const blog = {
        ...req.body,
        views: typeof req.body.views === 'number' ? req.body.views : 0,
    };
    const newBlog = new Blog(blog);
    try {
        await newBlog.save();
        res.status(201).json(normalizeBlog(newBlog));
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

export const updateBlog = async (req, res) => {
    try {
        const existingBlog = await Blog.findById(req.params.id);
        if (!existingBlog) return res.status(404).json({ message: 'Blog not found' });

        const nextViews =
            typeof req.body.views === 'number' ? req.body.views : (existingBlog.views ?? 0);

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            { ...req.body, views: nextViews },
            { new: true, runValidators: true }
        );

        res.status(200).json(normalizeBlog(updatedBlog));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteBlog = async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const regenerateBlogContent = async (req, res) => {
    try {
        const { content, title, category } = req.body;

        if (!content || !content.toString().trim()) {
            return res.status(400).json({ message: "Blog content is required." });
        }

        const rewritten = await rewriteContentWithAi({
            text: content,
            contentType: "blog",
            context: { title, category },
        });

        res.status(200).json({ content: rewritten });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const generateBlogSeo = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: "Blog title and content are required for SEO generation." });
        }

        const seo = await generateSeoWithAi({ title, content, contentType: "blog" });
        res.status(200).json(seo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
