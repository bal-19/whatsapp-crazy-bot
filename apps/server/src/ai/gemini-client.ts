import {
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory,
    type Content,
    type GenerativeModel,
} from "@google/generative-ai";
import { env } from "../config/env.js";

let model: GenerativeModel | null = null;

export function createGeminiModel(): GenerativeModel {
    if (!env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is required to call Gemini");
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

    return genAI.getGenerativeModel({
        model: env.GEMINI_MODEL,
        generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 512,
            responseMimeType: "text/plain",
        },
        safetySettings: [],
    });
}

export async function generateGeminiReply(
    systemPrompt: string,
    history: Content[],
    message: string,
): Promise<string> {
    model ??= createGeminiModel();

    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: systemPrompt }],
            },
            {
                role: "model",
                parts: [
                    {
                        text: "Siap. Saya akan mengikuti persona dan aturan itu.",
                    },
                ],
            },
            ...history,
        ],
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
}
