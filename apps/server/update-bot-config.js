#!/usr/bin/env node
/**
 * Script untuk update bot configuration di database
 * Mengganti bot_name menjadi "Ikmal" dan tone_style menjadi "helpful"
 */

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "data", "bot.db");

console.log("🔧 Updating bot configuration...");
console.log(`📂 Database: ${dbPath}`);

try {
    const db = new Database(dbPath);

    // Update bot_name menjadi "Ikmal"
    const updateName = db.prepare(`
    UPDATE bot_config 
    SET value = ?, updated_at = datetime('now')
    WHERE key = 'bot_name'
  `);

    const resultName = updateName.run("Ikmal");
    console.log(`✅ Updated bot_name: ${resultName.changes} row(s) affected`);

    // Update tone_style menjadi "helpful"
    const updateTone = db.prepare(`
    UPDATE bot_config 
    SET value = ?, updated_at = datetime('now')
    WHERE key = 'tone_style'
  `);

    const resultTone = updateTone.run("helpful");
    console.log(`✅ Updated tone_style: ${resultTone.changes} row(s) affected`);

    // Update system_prompt dengan persona baru
    const newPersona = `Nama kamu adalah Ikmal, asisten AI yang helpful dengan vibe Gen Z.

Tentang kamu:
- Kamu adalah asisten yang siap membantu dengan gaya bahasa santai ala anak muda
- Friendly, approachable, dan always ready to help
- Paham internet culture, slang Gen Z, dan cara ngobrol yang asik

Gaya komunikasi:
- Pakai bahasa Gen Z yang natural (misal: "gass", "bet", "sabi", "fr fr", "no cap")
- Helpful tapi tetap chill dan tidak kaku
- Emoji usage yang pas (jangan spam, tapi jangan stiff juga)
- Kalau bingung atau ga tau, jujur aja dengan cara yang asik
- Kasih solusi yang praktis dan mudah dipahami

Cara bantu:
- Jawab pertanyaan dengan jelas tapi tetap fun
- Kasih tips/saran yang berguna
- Support dan encouraging ke user
- Kalau ada yang butuh bantuan serius, tetap profesional tapi ga usah formal banget

Contoh gaya bahasa:
- "Sabi banget nih! Gas langsung aja..."
- "Oke bet, jadi gini ya..."
- "Fr fr ini solusinya..."
- "No cap, itu emang work sih..."
- "Santuy, aku jelasin step by step ya..."`;

    const updatePersona = db.prepare(`
    UPDATE bot_config 
    SET value = ?, updated_at = datetime('now')
    WHERE key = 'system_prompt'
  `);

    const resultPersona = updatePersona.run(newPersona);
    console.log(
        `✅ Updated system_prompt: ${resultPersona.changes} row(s) affected`,
    );

    // Tampilkan config saat ini
    console.log("\n📋 Current configuration:");
    const config = db.prepare("SELECT key, value FROM bot_config").all();
    config.forEach((row) => {
        if (row.key === "system_prompt") {
            console.log(`  ${row.key}: [${row.value.length} characters]`);
        } else {
            console.log(`  ${row.key}: ${row.value}`);
        }
    });

    db.close();
    console.log("\n✨ Bot configuration updated successfully!");
    console.log("🚀 Restart your server to apply changes.");
} catch (error) {
    console.error("❌ Error updating configuration:", error.message);
    process.exit(1);
}
