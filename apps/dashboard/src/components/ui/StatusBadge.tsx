import type { BotStatus } from '@whatsapp-bot/shared';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: BotStatus;
}

const LABELS: Record<BotStatus, string> = {
  connected: 'Online',
  disconnected: 'Offline',
  connecting: 'Menghubungkan'
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          status === 'connected' && 'bg-brand-500',
          status === 'connecting' && 'animate-pulse bg-amber-500',
          status === 'disconnected' && 'bg-red-500'
        )}
      />
      {LABELS[status]}
    </span>
  );
}
