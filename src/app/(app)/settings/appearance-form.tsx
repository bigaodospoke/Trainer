'use client';

import { Moon, Sun, Laptop, MousePointer2, Volume2, VolumeX } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { usePreferences } from '@/components/providers/preferences-provider';
import { GlassCard } from '@/components/ui/glass-card';
import { CursorPicker } from '@/components/settings/cursor-picker';
import type { ThemeMode } from '@/lib/theme';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'system', label: 'Seguir sistema', icon: Laptop },
];

export function AppearanceForm() {
  const { mode, setMode } = useTheme();
  const {
    cursorEnabled,
    setCursorEnabled,
    cursorSpecies,
    isCursorSupported,
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
  } = usePreferences();

  return (
    <GlassCard padding="lg">
      <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">Aparência</h2>

      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-dim">Tema</p>
          <div className="flex flex-wrap gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex items-center gap-2 rounded-pill border px-3.5 py-2 text-sm transition-colors ${
                  mode === value
                    ? 'border-purple-neon/50 bg-purple-core/15 text-ink-primary'
                    : 'border-white/10 text-ink-muted hover:text-ink-primary'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MousePointer2 className="h-4 w-4 text-ink-dim" strokeWidth={1.75} />
              <div>
                <p className="text-sm text-ink-primary">Cursor personalizado</p>
                <p className="text-xs text-ink-dim">
                  {isCursorSupported
                    ? `Seta colorida (tipo de ${cursorSpecies.name}) com o sprite ao lado`
                    : 'Indisponível no Firefox por enquanto — use Chrome/Edge para essa funcionalidade'}
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={cursorEnabled}
              onChange={setCursorEnabled}
              label="Cursor personalizado"
              disabled={!isCursorSupported}
            />
          </div>
          {cursorEnabled && isCursorSupported && (
            <div className="pl-7">
              <CursorPicker />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-ink-dim" strokeWidth={1.75} />
            ) : (
              <VolumeX className="h-4 w-4 text-ink-dim" strokeWidth={1.75} />
            )}
            <div>
              <p className="text-sm text-ink-primary">Sons dos Pokémon</p>
              <p className="text-xs text-ink-dim">Toca o cry ao selecionar um Pokémon</p>
            </div>
          </div>
          <ToggleSwitch checked={soundEnabled} onChange={setSoundEnabled} label="Sons dos Pokémon" />
        </div>

        {soundEnabled && (
          <div className="pl-7">
            <label className="mb-1.5 block text-xs text-ink-dim" htmlFor="sound-volume">
              Volume
            </label>
            <input
              id="sound-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={soundVolume}
              onChange={(e) => setSoundVolume(Number(e.target.value))}
              className="h-1.5 w-full max-w-xs accent-purple-neon"
            />
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-pill transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? 'bg-purple-core' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
