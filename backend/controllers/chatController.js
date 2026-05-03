import { GoogleGenAI } from "@google/genai";
import TourPackage from "../models/TourPackage.js";
import Blog from "../models/Blog.js";
import ChatConversation from "../models/ChatConversation.js";
import LanguageAssistantProfile from "../models/LanguageAssistantProfile.js";
import TravelDocumentationGuide from "../models/TravelDocumentationGuide.js";
import { buildTenantFilter } from "../utils/tenantContext.js";
import { buildSalesAssistantPayload } from "../utils/chatSalesAssistant.js";
import { canAccessFeature } from "../utils/subscriptionPlans.js";
import { buildCustomerSupportContext } from "../utils/customerSupportChatbot.js";

const normalizeTranscript = (items = []) =>
    (items || [])
        .filter((item) => item && typeof item.content === "string" && item.content.trim())
        .map((item) => ({
            role: item.role === "user" ? "user" : "model",
            content: item.content.trim(),
            createdAt: new Date(),
        }))
        .slice(-40);

const persistConversation = async (
    req,
    {
        sessionId,
        history = [],
        userMessage,
        assistantMessage,
        visitorProfile = {},
        assistantSignals = {},
    }
) => {
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
                    preferredLocale:
                        visitorProfile.preferredLocale ||
                        visitorProfile.browserLanguage ||
                        "",
                    assistantSignals,
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

const buildGenerationContents = (history = [], message = "") => [
    ...(history || []).map((item) => ({
        role: item.role === "user" ? "user" : "model",
        parts: [{ text: item.content }],
    })),
    { role: "user", parts: [{ text: message }] },
];

export const handleChat = async (req, res) => {
    const {
        message,
        history = [],
        sessionId,
        visitorProfile = {},
    } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
    }

    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const brandName = req.tenant?.name || "MAZ Expeditions";
        const tenantFilter = buildTenantFilter(req);
        const featureAccess = {
            multilingualAiAssistant: canAccessFeature(
                req.tenant?.subscription,
                "multi-language-ai-assistant"
            ),
            travelDocumentationAssistant: canAccessFeature(
                req.tenant?.subscription,
                "travel-documentation-assistant"
            ),
        };

        const [tours, blogs, languageProfiles, travelDocumentationGuides] = await Promise.all([
            TourPackage.find(tenantFilter).select(
                "title location price duration description tourType category"
            ),
            Blog.find(tenantFilter)
                .sort({ createdAt: -1 })
                .limit(5)
                .select("title content category"),
            featureAccess.multilingualAiAssistant
                ? LanguageAssistantProfile.find({
                    tenantId: req.tenantId,
                    status: "active",
                }).lean()
                : Promise.resolve([]),
            featureAccess.travelDocumentationAssistant
                ? TravelDocumentationGuide.find({
                    tenantId: req.tenantId,
                    status: "active",
                })
                    .sort({ lastReviewedAt: -1, updatedAt: -1 })
                    .lean()
                : Promise.resolve([]),
        ]);

        const { systemInstruction, assistantSignals } = buildCustomerSupportContext({
            tenantName: brandName,
            tours,
            blogs,
            message,
            visitorProfile,
            languageProfiles,
            travelDocumentationGuides,
            featureAccess,
        });

        const contents = buildGenerationContents(history, message);

        let response;
        try {
            response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents,
                config: {
                    systemInstruction,
                    maxOutputTokens: 800,
                },
            });
        } catch (innerError) {
            console.warn("Gemini 3 Failed, trying fallback...", innerError.message);
            response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents,
                config: {
                    systemInstruction,
                    maxOutputTokens: 800,
                },
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
            assistantSignals,
        });

        res.json({
            message: response.text,
            salesAssistant,
            assistantSignals,
        });
    } catch (error) {
        console.error("Chat Error:", error);

        const isNetworkError =
            error.message?.includes("ENOTFOUND") ||
            error.message?.includes("fetch failed") ||
            error.cause?.code === "ENOTFOUND";

        if (isNetworkError) {
            return res.status(503).json({
                error: "Network Connectivity Issue: We're having trouble connecting to our AI brain. Please check your internet connection or try again in a moment! 🌐🦁",
            });
        }

        if (error.status === 429) {
            return res.status(429).json({
                error: "Our AI assistant is temporarily resting due to high demand. Please try again in a minute or reach out to us on WhatsApp! ⏳🦁",
            });
        }

        res.status(500).json({
            error: "Something went wrong with the AI service. Please try our WhatsApp support! 🦁",
        });
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
