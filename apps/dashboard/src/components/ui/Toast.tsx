import { X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export function ToastViewport() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed right-4 top-4 z-50 flex w-96 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start justify-between gap-3 rounded-lg border bg-white p-4 text-sm shadow-modal',
            toast.type === 'success' && 'border-brand-200',
            toast.type === 'error' && 'border-red-200',
            toast.type === 'warning' && 'border-amber-200',
            toast.type === 'info' && 'border-blue-200'
          )}
        >
          <p className="text-slate-800">{toast.message}</p>
          <Button variant="ghost" size="icon" aria-label="Tutup notifikasi" onClick={() => removeToast(toast.id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
