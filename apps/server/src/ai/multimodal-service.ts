import type { Content } from "@google/generative-ai";

export type ImageAnalysisMode =
    | "describe"
    | "caption"
    | "roast"
    | "meme_explain";

export type MultimodalTask = "analysis" | "image_generation";

export function detectMultimodalTask(
    message: string,
    hasImageAttachment: boolean,
): MultimodalTask {
    const lower = message.toLowerCase();

    if (hasImageAttachment) {
        if (
            /\b(edit|ubah|ganti|tambah|hapus|remove|change|replace|modify|style|restyle)\b/.test(
                lower,
            ) ||
            /\b(generate|buat|bikin|buatkan)\b.*\b(gambar|image|foto|photo|poster|ilustrasi)\b/.test(
                lower,
            )
        ) {
            return "image_generation";
        }

        return "analysis";
    }

    if (
        /\b(generate|buat|bikin|buatkan|gambarkan|draw)\b.*\b(gambar|image|foto|photo|poster|ilustrasi|wallpaper|stiker)\b/.test(
            lower,
        ) ||
        /\b(gambar|image)\b.*\b(generate|buat|bikin|buatkan)\b/.test(lower)
    ) {
        return "image_generation";
    }

    return "analysis";
}

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
    task?: MultimodalTask;
}): string {
    const historyTranscript = serializeHistory(input.history);
    const modeInstruction =
        input.task === "image_generation"
            ? getImageGenerationInstruction()
            : getModeInstruction(input.mode);

    return [
        input.systemPrompt,
        historyTranscript
            ? `## Riwayat Percakapan Ringkas\n${historyTranscript}`
            : null,
        "## Tugas Saat Ini",
        modeInstruction,
        `Instruksi user: ${input.message}`,
        input.task === "image_generation"
            ? "Kembalikan gambar jika permintaan user meminta pembuatan atau pengeditan gambar. Sertakan caption pendek bila berguna."
            : "Jawab dalam teks biasa saja.",
    ]
        .filter(Boolean)
        .join("\n\n");
}

function getImageGenerationInstruction(): string {
    return [
        "Buat atau edit gambar sesuai instruksi user.",
        "Pertahankan konteks penting dari gambar referensi bila user mengirim gambar.",
        "Jangan hanya menjelaskan gambar jika user meminta dibuatkan atau dieditkan gambar.",
    ].join(" ");
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
