import {
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory,
    type Content,
    type GenerativeModel,
    type SafetySetting,
} from "@google/generative-ai";
import { env } from "../config/env.js";
import {
    buildMultimodalPrompt,
    detectImageAnalysisMode,
    type MultimodalTask,
} from "./multimodal-service.js";

let model: GenerativeModel | null = null;
let imageModel: GenerativeModel | null = null;
export const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

export interface GeminiMultimodalReply {
    text: string;
    image?: {
        buffer: Buffer;
        mimeType: string;
    };
}

const safetySettings: SafetySetting[] = [
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: "HARM_CATEGORY_CIVIC_INTEGRITY" as HarmCategory,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

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
        safetySettings,
    });
}

export function createGeminiImageModel(): GenerativeModel {
    if (!env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is required to call Gemini");
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

    return genAI.getGenerativeModel({
        model: GEMINI_IMAGE_MODEL,
        generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 2048,
        },
        safetySettings,
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

export async function generateGeminiImageReply(input: {
    systemPrompt: string;
    history: Content[];
    message: string;
    task: MultimodalTask;
    image?: {
        buffer: Buffer;
        mimeType: string;
    };
}): Promise<GeminiMultimodalReply> {
    imageModel ??= createGeminiImageModel();

    const prompt = buildMultimodalPrompt({
        systemPrompt: input.systemPrompt,
        history: input.history,
        message: input.message,
        mode: detectImageAnalysisMode(input.message),
        task: input.task,
    });

    const parts = [
        { text: prompt },
        input.image
            ? {
                  inlineData: {
                      data: input.image.buffer.toString("base64"),
                      mimeType: input.image.mimeType,
                  },
              }
            : null,
    ].filter((part): part is NonNullable<typeof part> => Boolean(part));

    const result = await imageModel.generateContent(parts);
    return extractMultimodalReply(result.response);
}

function extractMultimodalReply(response: {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
                inlineData?: {
                    data?: string;
                    mimeType?: string;
                };
            }>;
        };
    }>;
}): GeminiMultimodalReply {
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const text = parts
        .map((part) => part.text?.trim())
        .filter((value): value is string => Boolean(value))
        .join("\n")
        .trim();
    const imagePart = parts.find((part) => part.inlineData?.data)?.inlineData;

    return {
        text,
        ...(imagePart?.data
            ? {
                  image: {
                      buffer: Buffer.from(imagePart.data, "base64"),
                      mimeType: imagePart.mimeType ?? "image/png",
                  },
              }
            : {}),
    };
}
