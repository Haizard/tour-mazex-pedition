import { GoogleGenAI } from "@google/genai";
import Blog from "../models/Blog.js";
import TourPackage from "../models/TourPackage.js";
import { buildTenantFilter } from "../utils/tenantContext.js";

const generateAiImage = async (ai, prompt) => {
    const imageModels = [
        "gemini-3.1-flash-image-preview",
        "gemini-3-pro-image-preview",
        "gemini-2.0-flash-exp-image-generation",
        "gemini-2.5-flash-image"
    ];

    const generationPrompt = `Generate a high-quality, photorealistic tourism image of: ${prompt}. Cinematic lighting, 4k, professional photography.`;

    for (const modelId of imageModels) {
        const variants = [modelId, `models/${modelId}`];

        for (const variantId of variants) {
            try {
                console.log(`AI Blogger: Requesting native image from ${variantId}...`);

                const response = await ai.models.generateContent({
                    model: variantId,
                    contents: generationPrompt,
                    config: {
                        responseModalities: ["IMAGE"]
                    }
                });

                if (response?.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            console.log(`AI Blogger: Image generation successful with ${variantId}!`);
                            return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
                        }
                    }
                }
            } catch (error) {
                if (!(variantId === modelId && error.message.includes("not found"))) {
                    console.warn(`AI Blogger: ${variantId} attempt failed: ${error.message}`);
                }
            }
        }
    }

    console.warn("AI Blogger: All native image generation attempts failed.");
    return null;
};

const parseAiSections = (rawText) => {
    const text = rawText.trim();

    const extractSection = (name, nextNames) => {
        const escapedNext = nextNames.join("|");
        const regex = new RegExp(
            `${name}:\\s*([\\s\\S]*?)(?=\\n(?:${escapedNext}):|$)`,
            "i"
        );
        const match = text.match(regex);
        return match ? match[1].trim() : "";
    };

    const title = extractSection("TITLE", ["CATEGORY", "CONTENT", "IMAGE_PROMPT"]);
    const category = extractSection("CATEGORY", ["CONTENT", "IMAGE_PROMPT"]);
    const content = extractSection("CONTENT", ["IMAGE_PROMPT"]);
    const imagePrompt = extractSection("IMAGE_PROMPT", []);

    if (!title || !content) {
        throw new Error("AI response format was incomplete.");
    }

    return {
        title,
        category,
        content,
        imagePrompt,
    };
};

export const generateDailyBlog = async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: "Unauthorized access to automation endpoint." });
    }

    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const availableTours = await TourPackage.find(buildTenantFilter(req)).select("title").limit(10);
        const tourContext = availableTours.map((tour) => `- ${tour.title}`).join("\n");

        const Taxonomy = (await import("../models/Taxonomy.js")).default;
        const blogCats = await Taxonomy.find(buildTenantFilter(req, { type: "blogCategory" })).select("name");
        const brandName = req.tenant?.name || "MAZ Expeditions";
        const categoryList = blogCats.length > 0
            ? blogCats.map((category) => category.name).join(" | ")
            : "Safari News | Trekking Tips | Cultural Insights";

        const systemInstruction = `
            Act as a Senior Tanzanian Travel Journalist and Luxury Safari Architect for "${brandName}".
            Your goal is to write a weekly "Expert Insight" blog that feels handcrafted, authoritative, and deeply knowledgeable. Avoid generic AI phrasing.

            Internal Linking (CRITICAL):
            You must weave in 1 or 2 natural Markdown links to our existing tour packages when relevant.
            Format the links as: [Link Text](/packages/[Package-Title-Slugified])
            Note: Replace [Package-Title-Slugified] with the actual title, but replace spaces with hyphens (e.g., "Serengeti Safari" becomes "Serengeti-Safari").

            Available Tours for Linking:
            ${tourContext}

            Writing Style Requirements:
            - Professional and enthusiastic: use evocative language and concrete local insight.
            - Rich formatting and visuals:
              - Use Markdown throughout.
              - Use #### headers for sub-sections.
              - Use bold for key terms, place names, and wildlife.
              - Use italics for emphasis or local Swahili terms with translations.
              - Use bullet points or numbered lists for practical tips.
              - VIBRANT CONTENT: Add tasteful travel-themed emojis and icons (e.g. 🦁, 🌍, ✨, 🥾, 🌅) in-line to create a boutique, human feel.
              - Do not generate inline image placeholders or body image markdown.
            - Expert value: include specific advice that only a local expert would know.

            Conversion-Focused CTA (MANDATORY):
Every blog must end with a strong closing CTA that encourages booking a package or using the /plan-my-trip page.

            Your response MUST follow this exact plain-text structure:
            TITLE: A captivating, expert-level title
            CATEGORY: ${categoryList}
            CONTENT:
            A high-quality 500-800 word article with Markdown formatting, internal links, and a final persuasive CTA section.
            IMAGE_PROMPT: A highly detailed, photorealistic hero image prompt for the article.
        `;

        const contents = [
            {
                role: "user",
                parts: [
                    {
                        text: "Gather today's most interesting Tanzanian tourism news or advice and write a detailed blog post."
                    }
                ]
            }
        ];

        let response;
        const modelsToTry = [
            "models/gemini-3-flash-preview",
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-flash-latest",
            "models/gemini-pro-latest"
        ];
        let lastError;

        for (const modelName of modelsToTry) {
            try {
                console.log(`AI Blogger: Attempting generation with ${modelName}...`);
                response = await ai.models.generateContent({
                    model: modelName,
                    contents,
                    config: {
                        systemInstruction,
                        maxOutputTokens: 2500,
                        temperature: 0.4
                    }
                });
                if (response && response.text) break;
            } catch (err) {
                console.warn(`AI Blogger: ${modelName} failed:`, err.message);
                lastError = err;
            }
        }

        if (!response || !response.text) {
            throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
        }

        const blogData = parseAiSections(response.text);

        let imageUrl = await generateAiImage(ai, blogData.imagePrompt || blogData.title);
        if (!imageUrl) {
            imageUrl = "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1200";
        }

        const newBlog = new Blog({
            tenantId: req.tenantId,
            title: blogData.title,
            content: blogData.content,
            category: blogData.category,
            image: imageUrl,
            author: `${brandName} Expert`
        });

        await newBlog.save();

        res.status(201).json({
            message: "Daily blog generated successfully!",
            blog: newBlog
        });
    } catch (error) {
        console.error("Auto-Blog Error:", error);

        const isNetworkError = error.message?.includes("ENOTFOUND") ||
            error.message?.includes("fetch failed") ||
            error.cause?.code === "ENOTFOUND";

        if (isNetworkError) {
            return res.status(503).json({
                error: "Local Connectivity Issue: The server cannot reach the AI service. Please check your internet connection.",
                details: error.message
            });
        }

        res.status(500).json({ error: "Failed to generate daily blog.", details: error.message });
    }
};
