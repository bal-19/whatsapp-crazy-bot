import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './Card';
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
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg',
            color === 'default' && 'bg-slate-100 text-slate-700',
            color === 'green' && 'bg-brand-100 text-brand-700',
            color === 'red' && 'bg-red-100 text-red-700',
            color === 'yellow' && 'bg-amber-100 text-amber-700'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
