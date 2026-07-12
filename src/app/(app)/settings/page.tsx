import { SettingsTabs } from '@/components/settings/settings-tabs';
import { AppearanceForm } from './appearance-form';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink-primary">Configurações</h1>
      <SettingsTabs active="aparencia" />
      <AppearanceForm />
    </div>
  );
}
