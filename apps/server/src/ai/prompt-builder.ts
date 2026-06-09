import type { BotConfig } from "@whatsapp-bot/shared";

interface PromptContext {
    botName: string;
    persona: string;
    toneStyle: BotConfig["tone_style"];
    contactName?: string | null;
    personalMemorySummary?: string | null;
    knowledgeSummary?: string | null;
}

interface DocumentPromptContext {
    kind: "pdf" | "docx" | "xlsx";
}

const TONE_GUIDES: Record<BotConfig["tone_style"], string> = {
    pedas: "Tone: pedas, satir, smart-ass, tapi tetap tidak menyerang personal.",
    wholesome:
        "Tone: hangat, suportif, playful, humor ringan tanpa roasting keras.",
    absurd: "Tone: absurd, random, meme-ish, tetap jelas saat menjawab hal serius.",
    helpful: "Tone: romantis, lembut, dan penuh perhatian tetapi tidak alay.",
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

    const personalMemorySection = ctx.personalMemorySummary
        ? `
## Memory Personal User
${ctx.personalMemorySummary}
`.trim()
        : null;

    const knowledgeSection = ctx.knowledgeSummary
        ? `
## Knowledge Base Bisnis
Gunakan informasi berikut sebagai fakta prioritas bila relevan dengan pertanyaan user.
${ctx.knowledgeSummary}
`.trim()
        : null;

    return [
        coreRules,
        personaSection,
        contextSection,
        knowledgeSection,
        personalMemorySection,
    ]
        .filter(Boolean)
        .join("\n\n");
}

export function buildDocumentSystemPrompt(
    ctx: DocumentPromptContext,
): string {
    return [
        "## Peran",
        "Kamu adalah asisten penyusun dokumen profesional untuk kebutuhan bisnis dan operasional.",
        "Fokusmu adalah menghasilkan rancangan dokumen yang rapi, formal, jelas, akurat, dan siap dirender.",
        "",
        "## Aturan Wajib",
        "- Abaikan persona chatbot, gaya bercanda, gaya romantis, dan karakter informal apa pun.",
        "- Jangan meniru gaya percakapan personal user atau konfigurasi persona database.",
        "- Utamakan struktur yang profesional, bahasa yang efektif, dan isi yang relevan dengan tujuan dokumen.",
        `- Susun konten khusus untuk format ${ctx.kind.toUpperCase()} dan jangan merencanakan format lain.`,
        "- Jika detail user kurang lengkap, lengkapi dengan asumsi profesional yang aman, generik, dan tidak mengada-ada secara spesifik.",
        "- Jangan menambahkan disclaimer bahwa kamu AI atau catatan internal proses.",
        "- Hasil akhir nanti harus berupa JSON plan yang valid, konsisten, dan siap dirender oleh sistem.",
        "",
        "## Panduan Kualitas",
        "- Gunakan judul, section, bullet, tabel, atau sheet hanya jika memang membantu isi dokumen.",
        "- Untuk DOCX dan PDF, prioritaskan alur isi yang mudah dibaca dan siap dibagikan.",
        "- Untuk XLSX, prioritaskan struktur tabel yang ringkas, header yang jelas, dan data yang mudah diolah.",
        "- Gunakan bahasa yang sama dengan permintaan user kecuali user meminta bahasa lain.",
    ].join("\n");
}
