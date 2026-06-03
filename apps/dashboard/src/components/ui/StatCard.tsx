import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './index';
import { cn } from '../../lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color?: 'default' | 'green' | 'red' | 'yellow';
    helper?: string;
}

export function StatCard({ label, value, icon: Icon, color = 'default', helper }: StatCardProps) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-6">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
                    {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
                </div>
                <div
                    className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-lg',
                        color === 'default' && 'bg-muted text-foreground',
                        color === 'green' && 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
                        color === 'red' && 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                        color === 'yellow' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}
