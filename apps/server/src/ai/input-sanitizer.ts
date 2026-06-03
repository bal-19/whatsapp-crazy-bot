const MAX_INPUT_LENGTH = 2000;
const MIN_INPUT_LENGTH = 1;

export interface SanitizeResult {
  isValid: boolean;
  sanitized: string;
  reason?: 'empty_message' | 'truncated';
}

export function sanitizeInput(rawText: string): SanitizeResult {
  const text = stripHtml(rawText).trim();

  if (text.length < MIN_INPUT_LENGTH) {
    return { isValid: false, sanitized: '', reason: 'empty_message' };
  }

  if (text.length > MAX_INPUT_LENGTH) {
    return {
      isValid: true,
      sanitized: text.slice(0, MAX_INPUT_LENGTH),
      reason: 'truncated'
    };
  }

  const injectionPatterns = [
    /ignore (all |previous )?instructions/i,
    /you are now/i,
    /pretend (you are|to be)/i,
    /system:\s/i,
    /\[INST\]/i
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(text)) {
      console.warn('[INJECTION_ATTEMPT]', { text: text.slice(0, 100) });
      break;
    }
  }

  return { isValid: true, sanitized: text };
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}
