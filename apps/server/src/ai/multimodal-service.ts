import type { Content } from "@google/generative-ai";

export type ImageAnalysisMode =
    | "describe"
    | "caption"
    | "roast"
    | "meme_explain";

export function detectImageAnalysisMode(message: string): ImageAnalysisMode {
    const lower = message.toLowerCase();

    if (/\b(roast|roasting)\b/.test(lower)) return "roast";
    if (/\b(caption|caption-in|captionin)\b/.test(lower)) return "caption";
    if (/\b(meme|kenapa lucu|jelasin meme)\b/.test(lower)) {
        return "meme_explain";
    }

    return "describe";
}

export function buildMultimodalPrompt(input: {
    systemPrompt: string;
    history: Content[];
    message: string;
    mode: ImageAnalysisMode;
}): string {
    const historyTranscript = serializeHistory(input.history);
    const modeInstruction = getModeInstruction(input.mode);

    return [
        input.systemPrompt,
        historyTranscript
            ? `## Riwayat Percakapan Ringkas\n${historyTranscript}`
            : null,
        "## Tugas Saat Ini",
        modeInstruction,
        `Instruksi user: ${input.message}`,
        "Jawab dalam teks biasa saja.",
    ]
        .filter(Boolean)
        .join("\n\n");
}

function getModeInstruction(mode: ImageAnalysisMode): string {
    switch (mode) {
        case "caption":
            return "Buat caption singkat, kreatif, dan tetap sesuai persona.";
        case "roast":
            return "Roast isi gambar secara ringan, lucu, dan tidak menyerang personal.";
        case "meme_explain":
            return "Jelaskan isi meme dan kenapa meme itu bisa terasa lucu atau nyeleneh.";
        case "describe":
        default:
            return "Jelaskan isi gambar secara singkat, jelas, dan relevan dengan instruksi user.";
    }
}

function serializeHistory(history: Content[]): string | null {
    const lines = history
        .map((entry) => {
            const text = entry.parts
                .map((part) => ("text" in part && part.text ? part.text : null))
                .filter((value): value is string => Boolean(value))
                .join(" ")
                .trim();

            if (!text) return null;

            return `${entry.role === "model" ? "Bot" : "User"}: ${text}`;
        })
        .filter((value): value is string => Boolean(value))
        .slice(-8);

    return lines.length > 0 ? lines.join("\n") : null;
}
