import { GoogleGenAI } from "@google/genai";
import TourPackage from "../models/TourPackage.js";
import Blog from "../models/Blog.js";
import ChatConversation from "../models/ChatConversation.js";
import { buildTenantFilter } from "../utils/tenantContext.js";
import { buildSalesAssistantPayload } from "../utils/chatSalesAssistant.js";

const normalizeTranscript = (items = []) =>
    (items || [])
        .filter((item) => item && typeof item.content === "string" && item.content.trim())
        .map((item) => ({
            role: item.role === "user" ? "user" : "model",
            content: item.content.trim(),
            createdAt: new Date(),
        }))
        .slice(-40);

const persistConversation = async (req, { sessionId, history = [], userMessage, assistantMessage, visitorProfile = {} }) => {
    if (!sessionId) {
        return;
    }

    const transcript = normalizeTranscript([
        ...history,
        { role: "user", content: userMessage },
        { role: "model", content: assistantMessage },
    ]);

    const lastVisitorMessage = (userMessage || "").trim();
    const visitorLabel =
        visitorProfile.name?.toString().trim() ||
        visitorProfile.email?.toString().trim() ||
        "Website Visitor";

    await ChatConversation.findOneAndUpdate(
        { tenantId: req.tenantId, sessionId },
        {
            $set: {
                sourceChannel: "website-chat",
                visitorLabel,
                visitorEmail: visitorProfile.email?.toString().trim() || "",
                visitorPhone: visitorProfile.phone?.toString().trim() || "",
                status: "new",
                lastVisitorMessage,
                transcript,
                lastActivityAt: new Date(),
                metadata: {
                    lastSyncedFrom: "chatbot",
                },
            },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }
    );
};

export const handleChat = async (req, res) => {
    const { message, history, sessionId, visitorProfile } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
    }

    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        // Fetch context data
        const tours = await TourPackage.find(buildTenantFilter(req)).select('title location price duration description tourType category');
        const blogs = await Blog.find(buildTenantFilter(req)).sort({ createdAt: -1 }).limit(5).select('title content category');
        const brandName = req.tenant?.name || "MAZ Expeditions";

        const companyContext = `
            You are the "${brandName} Travel Expert", a senior Tanzanian safari consultant and experience architect for "${brandName}".
            Your goal is not just to answer questions, but to act as a professional guide who helps customers plan their dream adventure in Tanzania.

            Real-Time News & Seasonal Alerts (CRITICAL):
            You have access to our latest internal reports and blog updates. Use this information to create urgency and authority.
            Latest Updates from ${brandName} Blogs:
            ${blogs.map(b => `📍 NEWS: "${b.title}" - ${b.content.substring(0, 500)}...`).join('\n\n')}

            Expert Knowledge Base:
            1. Destinations: 
               - Serengeti: Best for the Great Migration (June-Oct). Central Serengeti is great year-round for big cats.
               - Ngorongoro: A "Natural Wonder" with the highest density of wildlife. Perfect for seeing the Big Five in one day.
               - Kilimanjaro: Requires preparation. Machame route is scenic; Marangu is the "Coca-Cola" route (huts).
               - Zanzibar: Best for post-safari relaxation. Stone Town for culture, Nungwi/Kendwa for best beaches.
            2. Planning Advice: 
               - Packing: Neutral colored clothing, good binoculars, sunscreen, and a power bank are essential.
               - When to Visit: Dry season (June-Oct) for wildlife; Green season (Nov-May) for birding and calving.
               - Techniques: Suggest starting with a Safari, then Trekking, and ending with Zanzibar beaches for the ultimate "Classic Tanzania" loop.
3. Tailor-Made Tours: We have a unique "Plan My Trip" system. If a user has specific needs, encourage them to visit our "/plan-my-trip" page to design their own itinerary from scratch.
            4. Group Tours: For budget-friendly options, mention our "Group Tour Packages" which have interactive capacity tracking.

            Guided Selling Skills (NEW):
- Identify Intent: If the user is browsing, suggest one of our popular "Packages". If they have a unique vision, direct them to our "/plan-my-trip" page.
            - Proactive CTAs: Don't just wait for questions. Proactively invite the user to take the next step.
- Example: "That sounds like a dream! Since you love wildlife photography, our 'Serengeti Photo Safari' is perfect. Would you like to check out that package, or should we design something totally unique on our /plan-my-trip page?"
            - Explain the Link: When suggesting a page, explain *why* it helps them. (e.g., "Our tailor-made system lets you pick your own pace and hotels").

            Our Current Packages:
            ${tours.map(t => `- ${t.title} (${t.location}): ${t.duration}, $${t.price}. [${t.tourType}] - ${t.description}`).join('\n')}

            Latest News/Blogs:
            ${blogs.map(b => `- ${b.title} (${b.category})`).join('\n')}

            Our Personality:
            - Knowledgeable: You speak with authority on wildlife and culture.
            - Guiding: You proactively suggest destination points and advice (e.g., "💡 **Expert Tip**: If you love photography, you must visit the Ndutu plains in February! 📸").
            - Persuasive: Convincingly explain why ${brandName} is the best choice (authentic, expert guides, ethical). Use benefit-driven language.
            - Conversational & Vibrant: Use relevant emojis (🦁, 🏔️, 🌊, 🌍, ✨) to make the conversation feel alive and engaging.
            - Conversion-Focused: Always look for a natural opportunity to suggest a booking link or a custom inquiry. 🚀

            Brevity & IMPACT Rules (MANDATORY):
            - Be Concise: Never use 50 words when 10 are enough. Keep total response under 150 words.
            - Summarize First: If the answer is complex, provide a one-sentence summary first.
            - Impact Flow: Use the structure: [Short Answer/Summary] -> [Expert Insight/News Context] -> [Clear CTA Link].
            - Avoid Fatigue: No long blocks of text. Use bullet points for efficiency, not for long lists.

            Rules:
            - Keep responses expert-level yet conversational.
            - Use bullet points and emojis (📍, 🗓️, 💰) for advice to make it readable and visually engaging.
            - Always try to mention a specific "Expert Tip" (💡) in your advice.
- When suggesting a route, use Markdown links and emojis: 🔗 [View Package](/packages/[Slugified-Title]) or 🗺️ [Design Your Own](/plan-my-trip).
        `;

        // Format history for the new SDK
        const contents = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
        }));

        // Add the current message
        contents.push({ role: 'user', parts: [{ text: message }] });

        let response;
        try {
            // Try the latest Gemini 3 model first
            response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: contents,
                config: {
                    systemInstruction: companyContext,
                    maxOutputTokens: 800,
                }
            });
        } catch (innerError) {
            console.warn("Gemini 3 Failed, trying fallback...", innerError.message);
            // Fallback to Gemini 1.5 Flash if 3.0 is unavailable or at quota
            response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: contents,
                config: {
                    systemInstruction: companyContext,
                    maxOutputTokens: 800,
                }
            });
        }

        const salesAssistant = buildSalesAssistantPayload({
            message,
            tours,
        });

        await persistConversation(req, {
            sessionId,
            history,
            userMessage: message,
            assistantMessage: response.text,
            visitorProfile,
        });

        res.json({
            message: response.text,
            salesAssistant,
        });
    } catch (error) {
        console.error("Chat Error:", error);

        // Check for DNS/Network errors
        const isNetworkError = error.message?.includes("ENOTFOUND") ||
            error.message?.includes("fetch failed") ||
            error.cause?.code === "ENOTFOUND";

        if (isNetworkError) {
            return res.status(503).json({
                error: "Network Connectivity Issue: We're having trouble connecting to our AI brain. Please check your internet connection or try again in a moment! 🌐🦁"
            });
        }

        if (error.status === 429) {
            return res.status(429).json({
                error: "Our AI assistant is temporarily resting due to high demand. Please try again in a minute or reach out to us on WhatsApp! ⏳🦁"
            });
        }
        res.status(500).json({ error: "Something went wrong with the AI service. Please try our WhatsApp support! 🦁" });
    }
};

export const listChatConversations = async (req, res) => {
    try {
        const conversations = await ChatConversation.find({ tenantId: req.tenantId })
            .sort({ lastActivityAt: -1, updatedAt: -1 })
            .lean();

        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateChatConversation = async (req, res) => {
    try {
        const updates = {};
        const allowedStatuses = new Set(["new", "open", "replied", "closed"]);

        if (req.body.status && allowedStatuses.has(req.body.status)) {
            updates.status = req.body.status;
        }

        if (typeof req.body.visitorLabel === "string") {
            updates.visitorLabel = req.body.visitorLabel.trim();
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No chat updates were provided." });
        }

        updates.lastActivityAt = new Date();

        const conversation = await ChatConversation.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenantId },
            { $set: updates },
            { new: true }
        ).lean();

        if (!conversation) {
            return res.status(404).json({ message: "Chat conversation not found." });
        }

        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
