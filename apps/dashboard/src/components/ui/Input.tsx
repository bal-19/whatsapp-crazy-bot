import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'focus-ring h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'focus-ring min-h-40 w-full resize-y rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
        className
      )}
      {...props}
    />
  );
}
