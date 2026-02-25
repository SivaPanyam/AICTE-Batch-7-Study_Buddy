import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();

if (!API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL_NAME = "gemini-2.0-flash";
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Helper to call Gemini with exponential backoff on 429
 */
const callWithRetry = async (fn, maxRetries = 3, initialDelay = 1000) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const errorStr = error.toString();
            const isQuotaError = errorStr.includes("429") || errorStr.includes("QUOTA_EXCEEDED");

            if (isQuotaError && i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                console.warn(`Gemini: Quota hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

/**
 * Generates text content from a given prompt and optional image parts.
 */
export const generateContent = async (prompt, imageParts = []) => {
    try {
        if (!API_KEY) {
            throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your environment variables.");
        }
        console.log("Gemini: Generating content...");

        const result = await callWithRetry(() => model.generateContent([prompt, ...imageParts]));
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        handleGeminiError(error, "generateContent");
        throw error;
    }
};

/**
 * Generates valid JSON content from a given prompt.
 */
export const generateJSON = async (prompt) => {
    try {
        if (!API_KEY) {
            throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your environment variables.");
        }
        console.log("Gemini: Generating JSON...");

        const jsonModel = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        });

        const result = await callWithRetry(() => jsonModel.generateContent(prompt));
        const response = await result.response;
        const text = response.text();

        const cleanedText = cleanJSONString(text);

        try {
            return JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("JSON Parse Error. Cleaned text was:", cleanedText);
            // Attempt a fallback regex match if simple parsing fails
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error("The AI response was not in a valid format. Please try again.");
        }
    } catch (error) {
        handleGeminiError(error, "generateJSON");
        throw error;
    }
};

/**
 * Common error handler for Gemini
 */
const handleGeminiError = (error, source) => {
    const errorMsg = error.message || error.toString();
    console.error(`Gemini API Error (${source}):`, error);

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
        alert("API Limit Reached: The study buddy is currently overwhelmed. Please wait a minute and try again.");
    } else if (errorMsg.includes("API key")) {
        alert("Configuration Error: The Gemini API Key is missing or invalid. Check your environment settings.");
    } else if (errorMsg.includes("Safety")) {
        alert("Content Blocked: The AI refused to generate this content due to safety filters.");
    }
};

/**
 * Helper to clean Markdown code blocks from JSON string
 */
const cleanJSONString = (text) => {
    return text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
};
