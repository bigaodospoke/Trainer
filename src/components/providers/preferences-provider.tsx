'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface PreferencesContextValue {
  cursorEnabled: boolean;
  setCursorEnabled: (v: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  soundVolume: number;
  setSoundVolume: (v: number) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const CURSOR_KEY = 'trainerly-cursor-psyduck';
const SOUND_ENABLED_KEY = 'trainerly-sound-enabled';
const SOUND_VOLUME_KEY = 'trainerly-sound-volume';

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [cursorEnabled, setCursorEnabledState] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [soundVolume, setSoundVolumeState] = useState(0.6);

  // Le preferencias salvas apos montar (evita mismatch de SSR).
  useEffect(() => {
    try {
      const cursor = window.localStorage.getItem(CURSOR_KEY);
      const sound = window.localStorage.getItem(SOUND_ENABLED_KEY);
      const volume = window.localStorage.getItem(SOUND_VOLUME_KEY);
      if (cursor !== null) setCursorEnabledState(cursor === '1');
      if (sound !== null) setSoundEnabledState(sound === '1');
      if (volume !== null) setSoundVolumeState(Number(volume));
    } catch {
      // ignora — segue com defaults
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('cursor-psyduck', cursorEnabled);
  }, [cursorEnabled]);

  const setCursorEnabled = useCallback((v: boolean) => {
    setCursorEnabledState(v);
    try {
      window.localStorage.setItem(CURSOR_KEY, v ? '1' : '0');
    } catch {}
  }, []);

  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
    try {
      window.localStorage.setItem(SOUND_ENABLED_KEY, v ? '1' : '0');
    } catch {}
  }, []);

  const setSoundVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setSoundVolumeState(clamped);
    try {
      window.localStorage.setItem(SOUND_VOLUME_KEY, String(clamped));
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ cursorEnabled, setCursorEnabled, soundEnabled, setSoundEnabled, soundVolume, setSoundVolume }),
    [cursorEnabled, setCursorEnabled, soundEnabled, setSoundEnabled, soundVolume, setSoundVolume]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences deve ser usado dentro de <PreferencesProvider>');
  return ctx;
}
