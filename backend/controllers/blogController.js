import process from "node:process";
import Blog from '../models/Blog.js';
import { rewriteContentWithAi, generateSeoWithAi } from "../utils/aiRewrite.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import {
    buildAssistantKnowledgeRecord,
    deleteAssistantKnowledgeEmbedding,
    syncAssistantKnowledgeEmbedding,
} from "../utils/pgvectorRetrieval.js";

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

const syncBlogKnowledgeEmbedding = async (blog = {}) => {
    try {
        await syncAssistantKnowledgeEmbedding(
            buildAssistantKnowledgeRecord({
                sourceType: "blog-post",
                sourceId: blog._id,
                tenantId: blog.tenantId,
                title: blog.title || "",
                body: [
                    blog.category,
                    blog.content,
                    blog.author,
                ].filter(Boolean).join(" "),
                metadata: {
                    category: blog.category || "",
                    author: blog.author || "",
                    destinationSlug: blog.destinationSlug || "",
                },
            }),
            process.env
        );
    } catch (error) {
        console.error("Blog knowledge embedding sync failed:", error.message);
    }
};

export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find(buildTenantFilter(req)).sort({ createdAt: -1 });
        res.status(200).json(blogs.map(normalizeBlog));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getBlogBySlug = async (req, res) => {
    try {
        const blogs = await Blog.find(buildTenantFilter(req));
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
        const blog = await Blog.findOne(buildTenantFilter(req, { _id: req.params.id }));
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
    const newBlog = new Blog(withTenantId(req, blog));
    try {
        await newBlog.save();
        await syncBlogKnowledgeEmbedding(newBlog.toObject());
        res.status(201).json(normalizeBlog(newBlog));
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

export const updateBlog = async (req, res) => {
    try {
        const existingBlog = await Blog.findOne(buildTenantFilter(req, { _id: req.params.id }));
        if (!existingBlog) return res.status(404).json({ message: 'Blog not found' });

        const nextViews =
            typeof req.body.views === 'number' ? req.body.views : (existingBlog.views ?? 0);

        const updatedBlog = await Blog.findOneAndUpdate(
            buildTenantFilter(req, { _id: req.params.id }),
            { ...req.body, views: nextViews },
            { new: true, runValidators: true }
        );

        await syncBlogKnowledgeEmbedding(updatedBlog.toObject());
        res.status(200).json(normalizeBlog(updatedBlog));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteBlog = async (req, res) => {
    try {
        const deletedBlog = await Blog.findOneAndDelete(buildTenantFilter(req, { _id: req.params.id }));
        if (deletedBlog) {
            await deleteAssistantKnowledgeEmbedding(
                {
                    sourceType: "blog-post",
                    sourceId: deletedBlog._id,
                },
                process.env
            );
        }
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

        const seo = await generateSeoWithAi({
            title,
            content,
            contentType: "blog",
            brandName: req.tenant?.name,
        });
        res.status(200).json(seo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
