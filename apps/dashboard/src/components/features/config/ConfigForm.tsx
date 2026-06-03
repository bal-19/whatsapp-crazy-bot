import type { BotConfig } from '@whatsapp-bot/shared';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input, Textarea } from '../../ui/Input';
import { ToggleSwitch } from '../../ui/ToggleSwitch';

interface ConfigFormProps {
  draft: BotConfig;
  isDirty: boolean;
  isSaving: boolean;
  onFieldChange: <K extends keyof BotConfig>(key: K, value: BotConfig[K]) => void;
  onSave: () => void;
  onReset: () => void;
}

export function ConfigForm({ draft, isDirty, isSaving, onFieldChange, onSave, onReset }: ConfigFormProps) {
  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-xs font-semibold uppercase text-slate-500">Nama Bot</span>
        <Input className="mt-2" value={draft.bot_name} onChange={(e) => onFieldChange('bot_name', e.target.value)} />
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded border border-slate-200 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Status Bot</p>
            <p className="text-xs text-slate-500">Aktif merespons pesan</p>
          </div>
          <ToggleSwitch label="Status bot" checked={draft.is_active} onChange={(value) => onFieldChange('is_active', value)} />
        </div>
        <div className="flex items-center justify-between rounded border border-slate-200 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Ignore Grup</p>
            <p className="text-xs text-slate-500">Matikan balasan di group chat</p>
          </div>
          <ToggleSwitch
            label="Abaikan grup"
            checked={draft.ignore_groups}
            onChange={(value) => onFieldChange('ignore_groups', value)}
          />
        </div>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase text-slate-500">Tone Style</span>
        <select
          className="focus-ring mt-2 h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm"
          value={draft.tone_style}
          onChange={(e) => onFieldChange('tone_style', e.target.value as BotConfig['tone_style'])}
        >
          <option value="pedas">Pedas</option>
          <option value="wholesome">Wholesome</option>
          <option value="absurd">Absurd</option>
          <option value="custom">Custom</option>
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase text-slate-500">System Prompt</span>
        <Textarea
          className="mt-2 min-h-64"
          value={draft.system_prompt}
          maxLength={4000}
          onChange={(e) => onFieldChange('system_prompt', e.target.value)}
        />
        <span className="mt-1 block text-right text-xs text-slate-500">{draft.system_prompt.length} / 4000 karakter</span>
      </label>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset Default
        </Button>
        <Button onClick={onSave} disabled={!isDirty || isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </div>
  );
}
