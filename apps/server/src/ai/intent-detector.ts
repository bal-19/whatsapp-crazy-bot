export type Intent = 'reset' | 'handoff' | 'normal';

export function detectIntent(message: string): Intent {
  const lower = message.toLowerCase().trim();

  if (lower === '/reset' || lower.includes('mulai dari awal')) return 'reset';

  if (
    lower.includes('bicara dengan manusia') ||
    lower.includes('hubungi admin') ||
    lower.includes('minta tolong orang')
  ) {
    return 'handoff';
  }

  return 'normal';
}
