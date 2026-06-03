import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'icon';
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'focus-ring inline-flex items-center justify-center gap-2 rounded border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700',
        variant === 'secondary' && 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        variant === 'ghost' && 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
        variant === 'danger' && 'border-red-600 bg-red-600 text-white hover:bg-red-700',
        size === 'sm' && 'h-8 px-3',
        size === 'md' && 'h-10 px-4',
        size === 'icon' && 'h-9 w-9 p-0',
        className
      )}
      {...props}
    />
  );
}
