const EMPTY_FALLBACK = 'Maaf, saya tidak bisa memproses pertanyaan Anda saat ini. 🙏';

export function processGeminiOutput(raw: string): string {
  if (!raw || raw.trim().length === 0) return EMPTY_FALLBACK;

  const sanitized = sanitizeForWhatsApp(raw);
  const normalized = normalizeWhitespace(sanitized);
  const truncated = truncateResponse(normalized, 800);
  const finalText = truncated.trim();

  return finalText.length > 0 ? finalText : EMPTY_FALLBACK;
}

export function sanitizeForWhatsApp(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n');
}

export function truncateResponse(text: string, maxChars = 800): string {
  if (text.length <= maxChars) return text;

  const truncated = text.slice(0, maxChars);
  const lastSentence = Math.max(truncated.lastIndexOf('. '), truncated.lastIndexOf('! '), truncated.lastIndexOf('? '));

  return lastSentence > 100 ? truncated.slice(0, lastSentence + 1) : `${truncated.trimEnd()}...`;
}
