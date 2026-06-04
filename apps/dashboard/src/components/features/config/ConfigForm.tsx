import type { BotConfig } from '@whatsapp-bot/shared';
import { Save, RotateCcw } from 'lucide-react';
import { Button, Input, Textarea, Switch, Label } from '@/components/ui';

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
        <div className="space-y-5 sm:space-y-6">
            <div className="space-y-2.5">
                <Label htmlFor="bot-name">Nama Bot</Label>
                <Input
                    id="bot-name"
                    value={draft.bot_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('bot_name', e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-input dark:border-slate-700 bg-card/80 dark:bg-slate-800/50 p-4 sm:p-5">
                    <div className="space-y-0.5">
                        <Label htmlFor="is-active">Status Bot</Label>
                        <p className="text-xs text-muted-foreground">Aktif merespons pesan</p>
                    </div>
                    <Switch
                        id="is-active"
                        checked={draft.is_active}
                        onCheckedChange={(value) => onFieldChange('is_active', value)}
                    />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-input dark:border-slate-700 bg-card/80 dark:bg-slate-800/50 p-4 sm:p-5">
                    <div className="space-y-0.5">
                        <Label htmlFor="ignore-groups">Ignore Grup</Label>
                        <p className="text-xs text-muted-foreground">Matikan balasan di group chat</p>
                    </div>
                    <Switch
                        id="ignore-groups"
                        checked={draft.ignore_groups}
                        onCheckedChange={(value) => onFieldChange('ignore_groups', value)}
                    />
                </div>
            </div>

            <div className="space-y-2.5">
                <Label htmlFor="tone-style">Tone Style</Label>
                <Input
                    id="tone-style"
                    type="text"
                    value={draft.tone_style}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('tone_style', e.target.value as BotConfig['tone_style'])}
                />
            </div>

            <div className="space-y-2.5">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                    id="system-prompt"
                    className="min-h-64 rounded-[1.5rem]"
                    value={draft.system_prompt}
                    maxLength={4000}
                    onChange={(e) => onFieldChange('system_prompt', e.target.value)}
                />
                <p className="text-right text-xs text-muted-foreground">{draft.system_prompt.length} / 4000 karakter</p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={onReset} className="w-full sm:w-auto">
                    <RotateCcw className="h-4 w-4" />
                    Reset Default
                </Button>
                <Button onClick={onSave} disabled={!isDirty || isSaving} className="w-full sm:w-auto">
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                </Button>
            </div>
        </div>
    );
}
