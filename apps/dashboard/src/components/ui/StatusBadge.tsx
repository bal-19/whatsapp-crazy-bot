import type { BotStatus } from '@whatsapp-bot/shared';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

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
        <Badge
            variant={status === 'connected' ? 'success' : status === 'disconnected' ? 'destructive' : 'warning'}
            className="gap-2"
        >
            <span
                className={cn(
                    'h-2 w-2 rounded-full',
                    status === 'connected' && 'bg-white',
                    status === 'connecting' && 'animate-pulse bg-white',
                    status === 'disconnected' && 'bg-white'
                )}
            />
            {LABELS[status]}
        </Badge>
    );
}
