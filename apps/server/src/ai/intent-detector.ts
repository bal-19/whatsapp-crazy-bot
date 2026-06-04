export type Intent =
    | "reset"
    | "handoff"
    | "memory_reset"
    | "command_list"
    | "normal";

export function detectIntent(message: string): Intent {
    const lower = message.toLowerCase().trim();

    if (lower === "/reset" || lower.includes("mulai dari awal")) return "reset";

    if (
        lower === "/resetmemory" ||
        lower === "/lupainaku" ||
        lower.includes("lupain aku")
    ) {
        return "memory_reset";
    }

    if (lower === "/list" || lower === "/help" || lower === "/commands") {
        return "command_list";
    }

    if (
        lower.includes("bicara dengan manusia") ||
        lower.includes("hubungi admin") ||
        lower.includes("minta tolong orang")
    ) {
        return "handoff";
    }

    return "normal";
}

/**
 * Cek apakah bot harus merespons pesan ini
 * Bot akan merespons jika nama bot disebutkan dalam pesan
 *
 * @param message - Pesan dari user
 * @param botName - Nama bot dari config
 * @returns true jika bot harus merespons
 */
export function shouldBotRespond(message: string, botName: string): boolean {
    const lower = message.toLowerCase().trim();
    const botNameLower = botName.toLowerCase().trim();

    // Split nama bot menjadi kata-kata individual untuk matching lebih fleksibel
    // Misal: "Bot Gila" bisa dipanggil dengan "bot", "gila", atau "bot gila"
    const botNameWords = botNameLower
        .split(/\s+/)
        .filter((word) => word.length > 2);

    // Cek apakah ada kata dari nama bot yang disebutkan
    for (const word of botNameWords) {
        if (lower.includes(word)) {
            return true;
        }
    }

    // Cek nama bot lengkap
    if (lower.includes(botNameLower)) {
        return true;
    }

    // Selalu respons untuk command khusus
    if (lower.startsWith("/") || lower.includes("mulai dari awal")) {
        return true;
    }

    return false;
}
