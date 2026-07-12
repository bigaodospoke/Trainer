'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CustomCursor } from '@/components/layout/custom-cursor';

export interface CursorSpecies {
  slug: string;
  name: string;
  spriteUrl: string;
  types: string[];
}

const DEFAULT_CURSOR_SPECIES: CursorSpecies = {
  slug: 'psyduck',
  name: 'Psyduck',
  spriteUrl: 'https://play.pokemonshowdown.com/sprites/gen5/psyduck.png',
  types: ['Water'],
};

interface PreferencesContextValue {
  cursorEnabled: boolean;
  setCursorEnabled: (v: boolean) => void;
  cursorSpecies: CursorSpecies;
  setCursorSpecies: (v: CursorSpecies) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  soundVolume: number;
  setSoundVolume: (v: number) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const CURSOR_KEY = 'trainerly-cursor-psyduck';
const CURSOR_SPECIES_KEY = 'trainerly-cursor-species';
const SOUND_ENABLED_KEY = 'trainerly-sound-enabled';
const SOUND_VOLUME_KEY = 'trainerly-sound-volume';

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [cursorEnabled, setCursorEnabledState] = useState(false);
  const [cursorSpecies, setCursorSpeciesState] = useState<CursorSpecies>(DEFAULT_CURSOR_SPECIES);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [soundVolume, setSoundVolumeState] = useState(0.6);

  // Le preferencias salvas apos montar (evita mismatch de SSR).
  useEffect(() => {
    try {
      const cursor = window.localStorage.getItem(CURSOR_KEY);
      const cursorSpeciesRaw = window.localStorage.getItem(CURSOR_SPECIES_KEY);
      const sound = window.localStorage.getItem(SOUND_ENABLED_KEY);
      const volume = window.localStorage.getItem(SOUND_VOLUME_KEY);
      if (cursor !== null) setCursorEnabledState(cursor === '1');
      if (cursorSpeciesRaw) {
        const parsed = JSON.parse(cursorSpeciesRaw);
        if (parsed?.slug && parsed?.spriteUrl) {
          setCursorSpeciesState({ ...parsed, types: parsed.types?.length ? parsed.types : ['Normal'] });
        }
      }
      if (sound !== null) setSoundEnabledState(sound === '1');
      if (volume !== null) setSoundVolumeState(Number(volume));
    } catch {
      // ignora — segue com defaults
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('cursor-custom', cursorEnabled);
  }, [cursorEnabled]);

  const setCursorEnabled = useCallback((v: boolean) => {
    setCursorEnabledState(v);
    try {
      window.localStorage.setItem(CURSOR_KEY, v ? '1' : '0');
    } catch {}
  }, []);

  const setCursorSpecies = useCallback((v: CursorSpecies) => {
    setCursorSpeciesState(v);
    try {
      window.localStorage.setItem(CURSOR_SPECIES_KEY, JSON.stringify(v));
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
    () => ({
      cursorEnabled,
      setCursorEnabled,
      cursorSpecies,
      setCursorSpecies,
      soundEnabled,
      setSoundEnabled,
      soundVolume,
      setSoundVolume,
    }),
    [cursorEnabled, setCursorEnabled, cursorSpecies, setCursorSpecies, soundEnabled, setSoundEnabled, soundVolume, setSoundVolume]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {cursorEnabled && (
        <style jsx global>{`
          html.cursor-custom,
          html.cursor-custom * {
            cursor: none !important;
          }
        `}</style>
      )}
      {cursorEnabled && <CustomCursor species={cursorSpecies} />}
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences deve ser usado dentro de <PreferencesProvider>');
  return ctx;
}
