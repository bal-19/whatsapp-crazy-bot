import { dashboardAppIcon } from '@/assets/icons';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
    className?: string;
    imageClassName?: string;
    alt?: string;
}

export function BrandMark({
    className,
    imageClassName,
    alt = 'WhatsApp AI dashboard icon'
}: BrandMarkProps) {
    return (
        <div
            className={cn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700/60',
                className
            )}
        >
            <img src={dashboardAppIcon} alt={alt} className={cn('h-full w-full object-cover', imageClassName)} />
        </div>
    );
}
