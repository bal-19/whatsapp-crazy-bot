# Audit Log

## Tujuan

Menyediakan jejak yang rapi untuk melihat bagaimana bot mengambil keputusan, memanggil AI, dan menghasilkan balasan.

Fitur ini penting agar perilaku bot bisa:

- ditelusuri saat ada bug
- diaudit saat jawaban terasa aneh
- dibandingkan saat prompt atau logic berubah
- dipakai untuk evaluasi kualitas respons

## Nilai Fitur

Untuk project bot AI yang fun dan bebas tanya apa saja, audit log berguna karena:

- perilaku bot bisa cepat berubah tergantung prompt dan context
- error AI sering sulit ditelusuri kalau hanya melihat pesan akhir
- eksperimen persona, multimodal, dan memory jadi lebih aman

## Contoh Pertanyaan yang Bisa Dijawab Audit Log

- kenapa bot membalas seperti itu?
- prompt apa yang dipakai saat itu?
- apakah memory personal ikut masuk ke prompt?
- apakah intent terdeteksi sebagai `normal`, `reset`, atau `handoff`?
- apakah model timeout atau kena rate limit?
- apakah reply berasal dari text-only atau multimodal flow?

## Kondisi Repo Saat Ini

Saat ini repo sudah punya fondasi observability:

- `system_logs` di database
- `logService`
- event seperti `message_received`, `message_ignored_no_mention`, `gemini_error`

Namun log sekarang masih event-oriented, belum berbentuk audit trail yang lengkap per request bot.

## Scope V1

Versi awal yang realistis:

- setiap inbound message punya satu audit trail
- simpan tahapan utama proses bot
- simpan metadata penting, bukan isi mentah berlebihan
- bisa dilihat untuk debugging dari dashboard atau query database

## Non-Goal V1

- belum perlu replay percakapan penuh
- belum perlu distributed tracing yang kompleks
- belum perlu menyimpan semua payload mentah media berukuran besar

## Struktur Audit yang Disarankan

Audit log sebaiknya merekam:

- `message_id`
- `contact_id`
- `bot_config_snapshot`
- `intent_result`
- `should_respond_result`
- `sanitized_input`
- `memory_summary_used`
- `prompt_version` atau ringkasan prompt
- `ai_model`
- `latency_ms`
- `reply_type`
- `error_category`
- `created_at`

## Bentuk Penyimpanan

Ada dua opsi yang cocok:

1. tambah tabel baru `audit_logs`
2. perluas `system_logs` dengan struktur yang lebih konsisten

Saran saya:

- untuk jangka panjang, lebih rapi pakai `audit_logs`
- untuk V1 cepat, bisa mulai dari `system_logs` dengan event naming yang disiplin

## Flow Runtime yang Disarankan

```text
Pesan masuk
  -> buat audit context
  -> sanitize input
  -> simpan hasil intent + shouldRespond
  -> jika lanjut ke AI, simpan memory summary dan model
  -> setelah reply dibuat, simpan latency + output summary
  -> jika gagal, simpan error classification
```

## Event Audit yang Disarankan

Beberapa event yang bisa dipakai:

- `audit_message_received`
- `audit_sanitized`
- `audit_intent_detected`
- `audit_memory_loaded`
- `audit_prompt_built`
- `audit_ai_requested`
- `audit_ai_succeeded`
- `audit_ai_failed`
- `audit_reply_sent`

## Arsitektur yang Cocok

Komponen yang relevan:

- `apps/server/src/bot/bot-manager.ts`
- `apps/server/src/ai/ai-service.ts`
- `apps/server/src/ai/prompt-builder.ts`
- `apps/server/src/ai/conversation-memory.ts`
- `apps/server/src/services/logService.ts`
- layer database di `apps/server/src/db`

Kemungkinan file baru:

- `apps/server/src/services/auditLogService.ts`
- `apps/server/src/types/audit.ts`

## Hubungan dengan Fitur Lain

Audit log akan sangat membantu untuk:

- personal memory
- image analysis
- multimodal replies
- eksperimen persona

Karena semua fitur itu menambah cabang logic yang akan lebih sulit di-debug jika tidak ada audit trail yang jelas.

## Risiko

- log bisa terlalu banyak dan noisy
- jika menyimpan prompt penuh, ukuran data bisa cepat membesar
- perlu hati-hati agar tidak menyimpan data sensitif secara berlebihan

## Batasan yang Disarankan

Supaya aman dan efisien:

- simpan ringkasan prompt, bukan prompt lengkap jika tidak perlu
- batasi panjang input dan output yang dicatat
- jangan simpan binary media mentah ke audit log
- beri retention policy untuk data audit

## Saran Implementasi

Urutan implementasi yang aman:

1. definisikan schema audit minimum
2. buat helper `auditLogService`
3. tambahkan audit context per inbound message
4. log tahapan utama di `bot-manager.ts` dan `ai-service.ts`
5. tambahkan metadata untuk memory, multimodal, dan error classification
6. baru expose ke dashboard jika memang dibutuhkan
