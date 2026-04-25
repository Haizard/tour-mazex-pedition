import { GoogleGenAI } from "@google/genai";

const MODELS_TO_TRY = [
  "models/gemini-2.0-flash",
  "models/gemini-flash-latest",
];

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

export const analyzeFeedbackSentiment = async (text) => {
  const ai = getClient();
  if (!ai || !text || text.trim().length < 10) {
    return {
      sentiment: "neutral",
      score: 0.5,
      summary: text ? text.substring(0, 100) : "No feedback provided."
    };
  }

  const prompt = `
Analyze the following traveler feedback for sentiment and core issues.
Feedback: "${text}"

Return a valid JSON object with:
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": 0 to 1 (1 being extremely positive),
  "summary": "a 1-sentence summary",
  "keyTopics": ["topic1", "topic2"],
  "improvementSuggestion": "a specific suggestion for the owner"
}
`.trim();

  try {
    for (const modelName of MODELS_TO_TRY) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });

        const result = JSON.parse(response.text?.trim()?.replace(/```json|```/g, "").trim());
        return result;
      } catch (e) {
        console.error(`Sentiment analysis failed for model ${modelName}:`, e.message);
      }
    }
  } catch (err) {
    console.error("AI Sentiment Analysis failed:", err);
  }

  return {
    sentiment: "neutral",
    score: 0.5,
    summary: text.substring(0, 100),
    keyTopics: [],
    improvementSuggestion: "N/A"
  };
};

export const generateMonthlyImprovementReport = async (feedbacks) => {
    const ai = getClient();
    if (!ai || !feedbacks || feedbacks.length === 0) {
        return "Not enough data for a monthly report yet.";
    }

    const feedbackList = feedbacks.map(f => `- [Rating: ${f.rating}/5] ${f.privateNote || f.publicReview || ''}`).join('\n');

    const prompt = `
Based on the following list of traveler feedback from the last 30 days, generate a "Reputation Guardian Monthly Improvement Report".
Identify patterns in complaints (if any), highlight what's working well, and provide 3 actionable steps for the operator to increase their review score.

Feedback List:
${feedbackList}

Return the report in clear, professional Markdown format with sections for "Executive Summary", "Key Trends", and "Action Plan".
`.trim();

    try {
        for (const modelName of MODELS_TO_TRY) {
            try {
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    config: { temperature: 0.4 },
                });
                return response.text?.trim();
            } catch (e) {
                console.error(`Report generation failed for model ${modelName}:`, e.message);
            }
        }
    } catch (err) {
        console.error("AI Report Generation failed:", err);
    }

    return "AI Report generation failed. Please review individual feedback manually.";
};
