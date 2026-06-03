import type { BotConfig } from '@whatsapp-bot/shared';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';

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
            <div className="space-y-2">
                <Label htmlFor="bot-name">Nama Bot</Label>
                <Input
                    id="bot-name"
                    value={draft.bot_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('bot_name', e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border bg-card p-4">
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
                <div className="flex items-center justify-between rounded-lg border bg-card p-4">
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

            <div className="space-y-2">
                <Label htmlFor="tone-style">Tone Style</Label>
                <Input
                    id="tone-style"
                    type="text"
                    value={draft.tone_style}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('tone_style', e.target.value as BotConfig['tone_style'])}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                    id="system-prompt"
                    className="min-h-64"
                    value={draft.system_prompt}
                    maxLength={4000}
                    onChange={(e) => onFieldChange('system_prompt', e.target.value)}
                />
                <p className="text-right text-xs text-muted-foreground">{draft.system_prompt.length} / 4000 karakter</p>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onReset}>
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
