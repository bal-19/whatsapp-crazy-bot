#!/usr/bin/env node
/**
 * Script untuk update bot configuration di Supabase.
 */

import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error(
        "SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi sebelum menjalankan script ini.",
    );
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

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

console.log("Updating bot configuration in Supabase...");

try {
    const { data: current, error: currentError } = await supabase
        .from("bot_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

    if (currentError) throw currentError;

    if (!current) {
        const { error: insertError } = await supabase.from("bot_settings").insert({
            bot_name: "Ikmal",
            system_prompt: newPersona,
            is_active: true,
            ignore_groups: false,
            tone_style: "helpful",
            documents_enabled: true,
            allowed_document_formats: ["pdf", "docx", "xlsx"],
        });

        if (insertError) throw insertError;
    } else {
        const { error: updateError } = await supabase
            .from("bot_settings")
            .update({
                bot_name: "Ikmal",
                system_prompt: newPersona,
                tone_style: "helpful",
                documents_enabled: true,
                allowed_document_formats: ["pdf", "docx", "xlsx"],
                updated_at: new Date().toISOString(),
            })
            .eq("id", current.id);

        if (updateError) throw updateError;
    }

    const { data: config, error: configError } = await supabase
        .from("bot_settings")
        .select("bot_name, system_prompt, is_active, ignore_groups, tone_style, updated_at")
        .limit(1)
        .maybeSingle();

    if (configError) throw configError;

    console.log("Current configuration:");
    console.log(`  bot_name: ${config?.bot_name}`);
    console.log(`  tone_style: ${config?.tone_style}`);
    console.log(`  is_active: ${config?.is_active}`);
    console.log(`  ignore_groups: ${config?.ignore_groups}`);
    console.log(`  system_prompt: [${config?.system_prompt?.length ?? 0} characters]`);
    console.log(`  updated_at: ${config?.updated_at}`);
} catch (error) {
    console.error(
        "Error updating configuration:",
        error instanceof Error ? error.message : error,
    );
    process.exit(1);
}
