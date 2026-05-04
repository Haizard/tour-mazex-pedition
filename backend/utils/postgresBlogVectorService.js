import { syncAssistantKnowledgeEmbedding, deleteAssistantKnowledgeEmbedding } from "./pgvectorRetrieval.js";

/**
 * Orchestrates the semantic indexing of a Blog Post.
 */
export const syncBlogVector = async (blog = {}, env = globalThis.process?.env || {}) => {
  if (!blog._id || !blog.tenantId) return;

  const body = [
    `Category: ${blog.category || ""}`,
    `Author: ${blog.author || ""}`,
    `Content: ${blog.content || ""}`,
  ].filter(Boolean).join("\n");

  const metadata = {
    category: blog.category || "",
    author: blog.author || "",
    destinationSlug: blog.destinationSlug || "",
  };

  await syncAssistantKnowledgeEmbedding({
    sourceType: "blog-post",
    sourceId: String(blog._id),
    tenantId: String(blog.tenantId),
    title: blog.title || "",
    body,
    metadata,
  }, env);
};

/**
 * Removes a Blog Post from the semantic index.
 */
export const deleteBlogVector = async (blogId, env) => {
  await deleteAssistantKnowledgeEmbedding({
    sourceType: "blog-post",
    sourceId: String(blogId),
  }, env);
};
