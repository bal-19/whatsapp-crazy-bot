import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './index';
import { cn } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color?: 'default' | 'green' | 'red' | 'yellow';
    helper?: string;
}

export function StatCard({ label, value, icon: Icon, color = 'default', helper }: StatCardProps) {
    return (
        <Card className="mesh-card overflow-hidden">
            <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5 lg:p-6">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">
                        {label}
                    </p>
                    <p className="mt-2 break-words text-xl font-bold text-foreground sm:mt-2.5 sm:text-2xl">
                        {value}
                    </p>
                    {helper && (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                            {helper}
                        </p>
                    )}
                </div>
                <div
                    className={cn(
                        'flex shrink-0 items-center justify-center rounded-xl shadow-inner',
                        'h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12',
                        color === 'default' && 'bg-slate-900 text-white',
                        color === 'green' && 'bg-emerald-100 text-emerald-700 dark:bg-green-900/20 dark:text-green-400',
                        color === 'red' && 'bg-rose-100 text-rose-700 dark:bg-red-900/20 dark:text-red-400',
                        color === 'yellow' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    )}
                >
                    <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </div>
            </CardContent>
        </Card>
    );
}