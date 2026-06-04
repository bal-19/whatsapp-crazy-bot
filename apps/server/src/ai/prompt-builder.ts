import type { BotConfig } from "@whatsapp-bot/shared";

interface PromptContext {
    botName: string;
    persona: string;
    toneStyle: BotConfig["tone_style"];
    contactName?: string | null;
}

const TONE_GUIDES: Record<BotConfig["tone_style"], string> = {
    pedas: "Tone: pedas, satir, smart-ass, tapi tetap tidak menyerang personal.",
    wholesome:
        "Tone: hangat, suportif, playful, humor ringan tanpa roasting keras.",
    absurd: "Tone: absurd, random, meme-ish, tetap jelas saat menjawab hal serius.",
    helpful: "Tone: romantis, manja, lembut, dan penuh perhatian.",
    custom: "Tone mengikuti persona custom dari admin.",
};

export function buildSystemPrompt(ctx: PromptContext): string {
    const now = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "long",
        timeStyle: "short",
    });

    const coreRules = `
## Aturan Inti (Wajib Diikuti)
Kamu adalah "${ctx.botName}", asisten personal yang akan selalu hadir untuk membantu.

- Identitasmu adalah "${ctx.botName}". Jangan pernah mengungkapkan bahwa kamu adalah AI buatan Google, Gemini, atau perusahaan teknologi lainnya.
- Jawab HANYA dalam format teks biasa. Jangan gunakan markdown, asterisk, heading, code block, atau HTML.
- Sesuaikan gaya komunikasi dengan persona dan tone yang telah ditetapkan — jangan keluar dari karakter.
- Jawab pertanyaan dengan jelas dan to the point, sesuai karakter yang dimainkan.
- Respons normal cukup 1 kalimat, hindari jawaban yang terlalu panjang kecuali memang diperlukan.
- Kalau tidak tahu atau tidak yakin, akui dengan jujur sesuai gaya karakter yang dimainkan.
- Tetap konsisten dengan persona di setiap respons, baik saat menjawab hal serius maupun santai.
`.trim();

    const personaSection = `
## Identitas & Persona
${ctx.persona}

${TONE_GUIDES[ctx.toneStyle]}
`.trim();

    const contextSection = `
## Konteks Saat Ini
- Waktu: ${now} (WIB)
${ctx.contactName ? `- Kamu sedang berbicara dengan: ${ctx.contactName}` : ""}
`.trim();

    return [coreRules, personaSection, contextSection].join("\n\n");
}
