'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { THEME_COOKIE, resolveTheme, type ThemeMode } from '@/lib/theme';
import { LYCANROC_SPRITES } from '@/lib/lycanroc';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'dark' | 'light';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeClass(resolved: 'dark' | 'light') {
  const root = document.documentElement;
  root.classList.toggle('light', resolved === 'light');
  root.style.colorScheme = resolved;
}

/** Favicon dinamico — Lycanroc Midday (claro) / Midnight (escuro), sempre em
 *  sincronia com o tema resolvido (inclusive quando muda via "seguir
 *  sistema", nao so no clique do toggle). */
function applyFavicon(resolved: 'dark' | 'light') {
  const href = LYCANROC_SPRITES[resolved].icon;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/png';
  link.href = href;
}

function readSystemPrefersDark() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({
  children,
  initialMode,
}: {
  children: React.ReactNode;
  /** Modo lido do cookie no servidor, para renderizar certo desde o SSR. */
  initialMode: ThemeMode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);

  useEffect(() => {
    setSystemPrefersDark(readSystemPrefersDark());
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  const resolved = useMemo(() => resolveTheme(mode, systemPrefersDark), [mode, systemPrefersDark]);

  useEffect(() => {
    applyThemeClass(resolved);
    applyFavicon(resolved);
  }, [resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      window.localStorage.setItem(THEME_COOKIE, next);
    } catch {
      // localStorage/cookies indisponiveis (modo privado etc) — segue so em memoria.
    }
  }, []);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  return ctx;
}
