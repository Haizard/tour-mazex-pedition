import { useEffect, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import { fetchBlogs, repurposeBlogContent } from "../../services/api";

const ContentRepurposingManager = () => {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlogId, setSelectedBlogId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBlogs = async () => {
      setLoading(true);
      try {
        const response = await fetchBlogs();
        setBlogs(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load blogs.");
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, []);

  const handleGenerate = async () => {
    if (!selectedBlogId) {
      setError("Choose a blog before generating repurposed content.");
      return;
    }

    setGenerating(true);
    setError("");
    try {
      const response = await repurposeBlogContent({ blogId: selectedBlogId });
      setResult(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to generate repurposed content."
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            Content Repurposing
          </p>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Blog To Channel Assets
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-2 max-w-3xl">
            Turn one blog post into Instagram, Facebook, email, and WhatsApp-ready copy
            so your team can move faster across channels.
          </p>
        </div>
        <Badge variant="secondary">{blogs.length} Blogs Available</Badge>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <Card className="p-8 border-none shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 block mb-2">
              Source Blog
            </label>
            <select
              value={selectedBlogId}
              onChange={(event) => setSelectedBlogId(event.target.value)}
              className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose a blog post</option>
              {blogs.map((blog) => (
                <option key={blog._id} value={blog._id}>
                  {blog.title}
                </option>
              ))}
            </select>
          </div>

          <Button type="button" onClick={handleGenerate} disabled={loading || generating}>
            {generating ? "Generating..." : "Repurpose Content"}
          </Button>
        </div>
      </Card>

      {result && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card className="p-8 border-none shadow-xl">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4">
              Instagram Posts
            </h3>
            <div className="space-y-4">
              {result.instagramPosts.map((post, index) => (
                <div key={`ig-${index}`} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                  {post}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8 border-none shadow-xl">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4">
              Facebook Posts
            </h3>
            <div className="space-y-4">
              {result.facebookPosts.map((post, index) => (
                <div key={`fb-${index}`} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 whitespace-pre-wrap">
                  {post}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8 border-none shadow-xl">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4">
              Email Campaign
            </h3>
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Subject
              </p>
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                {result.emailCampaign.subject}
              </p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Preview
              </p>
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                {result.emailCampaign.previewText}
              </p>
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 whitespace-pre-wrap">
                {result.emailCampaign.body}
              </p>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-xl">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4">
              WhatsApp Message
            </h3>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
              {result.whatsappMessage}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContentRepurposingManager;
