import { useEffect } from 'react';
import { ConfigForm } from '../components/features/config/ConfigForm';
import { PromptTester } from '../components/features/config/PromptTester';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useConfigStore } from '../stores/configStore';
import { useUIStore } from '../stores/uiStore';

export function ConfigPage() {
  const {
    draft,
    isDirty,
    isSaving,
    isTesting,
    testReply,
    loadConfig,
    updateField,
    saveConfig,
    resetToDefaults,
    testPrompt
  } = useConfigStore();
  const addToast = useUIStore((state) => state.addToast);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  async function handleSave() {
    await saveConfig();
    addToast({ type: 'success', message: 'Konfigurasi tersimpan' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Konfigurasi Bot</h1>
        <p className="text-sm text-slate-500">Atur persona, tone, dan perilaku bot.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Umum</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfigForm
              draft={draft}
              isDirty={isDirty}
              isSaving={isSaving}
              onFieldChange={updateField}
              onSave={() => void handleSave()}
              onReset={resetToDefaults}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prompt Tester</CardTitle>
          </CardHeader>
          <CardContent>
            <PromptTester reply={testReply} isTesting={isTesting} onTest={(message) => void testPrompt(message)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
