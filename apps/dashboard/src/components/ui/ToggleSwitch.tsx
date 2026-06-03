import { cn } from '../../lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-ring inline-flex h-6 w-11 items-center rounded-full transition',
        checked ? 'bg-brand-600' : 'bg-slate-300'
      )}
    >
      <span
        className={cn('h-5 w-5 rounded-full bg-white shadow transition', checked ? 'translate-x-5' : 'translate-x-0.5')}
      />
    </button>
  );
}
